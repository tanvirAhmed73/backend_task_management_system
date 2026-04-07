import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TaskStatus, UserRole } from '@prisma/client';
import type { SafeUser } from '../auth/types/safe-user.type';
import { EmailJobsService } from '../mail/email-jobs.service';
import {
  NotificationsBusService,
  TASK_ASSIGNED_EVENT,
  TASK_COMPLETED_EVENT,
  type TaskAssignedNotificationPayload,
  type TaskCompletedNotificationPayload,
} from '../notifications/notifications-bus.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import type { TaskViewDto } from './dto/task-view.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';

const taskInclude = {
  assignee: {
    select: { id: true, email: true, name: true },
  },
  created_by: {
    select: { id: true, email: true, name: true },
  },
} satisfies Prisma.TaskInclude;

type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsBusService,
    private readonly emailJobs: EmailJobsService,
  ) {}

  private toView(row: TaskWithRelations): TaskViewDto {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      assignee: row.assignee,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private async assertActiveUserId(id: string): Promise<void> {
    const u = await this.prisma.user.findFirst({
      where: { id, deleted_at: null },
      select: { id: true },
    });
    if (!u) {
      throw new BadRequestException('Assignee user not found or inactive');
    }
  }

  private canEdit(user: SafeUser, row: { created_by_id: string; assignee_id: string | null }): boolean {
    if (user.role === 'ADMIN') return true;
    return (
      row.created_by_id === user.id ||
      row.assignee_id === user.id
    );
  }

  private canDelete(user: SafeUser, row: { created_by_id: string }): boolean {
    if (user.role === 'ADMIN') return true;
    return row.created_by_id === user.id;
  }

  /**
   * Notify the new assignee when they are set (create or reassignment).
   * Skips self-assignment and no-op assignee updates.
   */
  private notifyNewAssignee(
    actor: SafeUser,
    previousAssigneeId: string | null,
    newAssigneeId: string | null,
    task: TaskViewDto,
  ): void {
    if (!newAssigneeId || newAssigneeId === actor.id) return;
    if (previousAssigneeId === newAssigneeId) return;

    const payload: TaskAssignedNotificationPayload = {
      type: 'TASK_ASSIGNED',
      message: `You were assigned to task "${task.title}"`,
      task: {
        id: task.id,
        title: task.title,
        status: task.status,
      },
      assignedBy: {
        id: actor.id,
        email: actor.email,
        name: actor.name,
      },
    };
    this.notifications.emitToUser(
      newAssigneeId,
      TASK_ASSIGNED_EVENT,
      payload,
    );

    const assignee = task.assignee;
    if (assignee?.id === newAssigneeId) {
      void this.emailJobs.enqueueTaskAssigned({
        toEmail: assignee.email,
        recipientName: assignee.name,
        taskId: task.id,
        taskTitle: task.title,
        taskStatus: task.status,
        assignerName: actor.name,
        assignerEmail: actor.email,
      });
    }
  }

  /** When the assignee moves a task to DONE, notify all admins (WebSocket + email). */
  private async notifyAdminsTaskCompleted(
    task: TaskViewDto,
    completedBy: SafeUser,
  ): Promise<void> {
    const payload: TaskCompletedNotificationPayload = {
      type: 'TASK_COMPLETED',
      message: `Assignee marked task "${task.title}" as done`,
      task: {
        id: task.id,
        title: task.title,
        status: task.status,
      },
      completedBy: {
        id: completedBy.id,
        email: completedBy.email,
        name: completedBy.name,
      },
    };
    this.notifications.emitToAdmins(TASK_COMPLETED_EVENT, payload);

    const admins = await this.prisma.user.findMany({
      where: { deleted_at: null, role: UserRole.ADMIN },
      select: { email: true, name: true },
    });
    for (const a of admins) {
      void this.emailJobs.enqueueTaskCompletedNotice({
        toEmail: a.email,
        adminRecipientName: a.name,
        taskId: task.id,
        taskTitle: task.title,
        completedByName: completedBy.name,
        completedByEmail: completedBy.email,
      });
    }
  }

  private async notifyAdminsIfAssigneeCompletedTask(
    existing: TaskWithRelations,
    row: TaskWithRelations,
    actor: SafeUser,
    task: TaskViewDto,
  ): Promise<void> {
    const becameDone =
      existing.status !== TaskStatus.DONE && row.status === TaskStatus.DONE;
    const assigneeFinished =
      existing.assignee_id !== null && actor.id === existing.assignee_id;
    if (!becameDone || !assigneeFinished) {
      return;
    }
    await this.notifyAdminsTaskCompleted(task, actor);
  }

  async create(dto: CreateTaskDto, actor: SafeUser): Promise<TaskViewDto> {
    if (dto.assignee_id) {
      await this.assertActiveUserId(dto.assignee_id);
    }

    const row = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status ?? TaskStatus.PENDING,
        assignee_id: dto.assignee_id ?? null,
        created_by_id: actor.id,
      },
      include: taskInclude,
    });
    const view = this.toView(row);
    this.notifyNewAssignee(actor, null, row.assignee_id, view);
    return view;
  }

  async findAll(query: ListTasksQueryDto): Promise<TaskViewDto[]> {
    const where: Prisma.TaskWhereInput = {
      deleted_at: null,
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.assignee_id !== undefined
        ? { assignee_id: query.assignee_id }
        : {}),
    };

    const rows = await this.prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: { updated_at: 'desc' },
    });
    return rows.map((r) => this.toView(r));
  }

  async findOne(id: string): Promise<TaskViewDto> {
    const row = await this.prisma.task.findFirst({
      where: { id, deleted_at: null },
      include: taskInclude,
    });
    if (!row) {
      throw new NotFoundException('Task not found');
    }
    return this.toView(row);
  }

  async update(id: string, dto: UpdateTaskDto, actor: SafeUser): Promise<TaskViewDto> {
    const existing = await this.prisma.task.findFirst({
      where: { id, deleted_at: null },
      include: taskInclude,
    });
    if (!existing) {
      throw new NotFoundException('Task not found');
    }
    if (!this.canEdit(actor, existing)) {
      throw new ForbiddenException(
        'You can only update tasks you created or are assigned to (admins: any task)',
      );
    }

    const previousAssigneeId = existing.assignee_id;

    if (dto.assignee_id !== undefined && dto.assignee_id !== null) {
      await this.assertActiveUserId(dto.assignee_id);
    }

    const data: Prisma.TaskUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.assignee_id !== undefined) {
      if (dto.assignee_id === null) {
        data.assignee = { disconnect: true };
      } else {
        data.assignee = { connect: { id: dto.assignee_id } };
      }
    }

    if (Object.keys(data).length === 0) {
      return this.toView(existing);
    }

    const row = await this.prisma.task.update({
      where: { id },
      data,
      include: taskInclude,
    });
    const view = this.toView(row);
    this.notifyNewAssignee(actor, previousAssigneeId, row.assignee_id, view);
    await this.notifyAdminsIfAssigneeCompletedTask(existing, row, actor, view);
    return view;
  }

  async remove(id: string, actor: SafeUser): Promise<void> {
    const existing = await this.prisma.task.findFirst({
      where: { id, deleted_at: null },
      select: { id: true, created_by_id: true },
    });
    if (!existing) {
      throw new NotFoundException('Task not found');
    }
    if (!this.canDelete(actor, existing)) {
      throw new ForbiddenException(
        'You can only delete tasks you created (admins: any task)',
      );
    }

    await this.prisma.task.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}

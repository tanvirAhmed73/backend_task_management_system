import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import type { SafeUser } from '../auth/types/safe-user.type';
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
  constructor(private readonly prisma: PrismaService) {}

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
    return this.toView(row);
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
    return this.toView(row);
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

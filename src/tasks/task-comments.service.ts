import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import type { SafeUser } from '../auth/types/safe-user.type';
import {
  NotificationsBusService,
  TASK_COMMENT_EVENT,
  type TaskCommentNotificationPayload,
} from '../notifications/notifications-bus.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import type { TaskCommentViewDto } from './dto/task-comment-view.dto';

const authorSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
} satisfies Prisma.UserSelect;

type CommentWithAuthor = Prisma.TaskCommentGetPayload<{
  include: { author: { select: typeof authorSelect } };
}>;

@Injectable()
export class TaskCommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsBusService,
    private readonly notificationsStore: NotificationsService,
  ) {}

  private toView(row: CommentWithAuthor): TaskCommentViewDto {
    return {
      id: row.id,
      body: row.body,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author: {
        id: row.author.id,
        email: row.author.email,
        name: row.author.name,
        role: row.author.role as TaskCommentViewDto['author']['role'],
      },
    };
  }

  private canAccessTaskComments(
    user: SafeUser,
    task: { assignee_id: string | null; created_by_id: string },
  ): boolean {
    if (user.role === 'ADMIN') return true;
    return (
      task.assignee_id === user.id || task.created_by_id === user.id
    );
  }

  private async getActiveTaskOrThrow(taskId: string): Promise<{
    id: string;
    title: string;
    assignee_id: string | null;
    created_by_id: string;
  }> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deleted_at: null },
      select: {
        id: true,
        title: true,
        assignee_id: true,
        created_by_id: true,
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async findAllForTask(
    taskId: string,
    user: SafeUser,
  ): Promise<TaskCommentViewDto[]> {
    const task = await this.getActiveTaskOrThrow(taskId);
    if (!this.canAccessTaskComments(user, task)) {
      throw new ForbiddenException(
        'You can only view comments on tasks you created, are assigned to, or if you are an admin',
      );
    }

    const rows = await this.prisma.taskComment.findMany({
      where: { task_id: taskId },
      include: { author: { select: authorSelect } },
      orderBy: { created_at: 'asc' },
    });
    return rows.map((r) => this.toView(r));
  }

  async create(
    taskId: string,
    dto: CreateTaskCommentDto,
    actor: SafeUser,
  ): Promise<TaskCommentViewDto> {
    const task = await this.getActiveTaskOrThrow(taskId);
    if (!this.canAccessTaskComments(actor, task)) {
      throw new ForbiddenException(
        'You can only comment on tasks you created, are assigned to, or if you are an admin',
      );
    }

    const row = await this.prisma.taskComment.create({
      data: {
        body: dto.body.trim(),
        task_id: taskId,
        author_id: actor.id,
      },
      include: { author: { select: authorSelect } },
    });

    const view = this.toView(row);
    await this.pushCommentNotifications(task, view, actor);
    return view;
  }

  private async pushCommentNotifications(
    task: { id: string; title: string; assignee_id: string | null; created_by_id: string },
    comment: TaskCommentViewDto,
    actor: SafeUser,
  ): Promise<void> {
    const payload: TaskCommentNotificationPayload = {
      type: 'TASK_COMMENT_ADDED',
      task: { id: task.id, title: task.title },
      comment: {
        id: comment.id,
        body: comment.body,
        created_at: comment.created_at.toISOString(),
        author: {
          id: comment.author.id,
          email: comment.author.email,
          name: comment.author.name,
          role: comment.author.role,
        },
      },
    };

    if (actor.role === 'ADMIN') {
      const targets = new Set<string>();
      if (task.assignee_id && task.assignee_id !== actor.id) {
        targets.add(task.assignee_id);
      }
      if (task.created_by_id !== actor.id) {
        targets.add(task.created_by_id);
      }
      for (const userId of targets) {
        this.notifications.emitToUser(userId, TASK_COMMENT_EVENT, payload);
        await this.notificationsStore.createForUser({
          recipientId: userId,
          type: NotificationType.TASK_COMMENT_ADDED,
          title: `New comment on "${task.title}"`,
          message: 'Admin commented on the task',
          data: payload,
        });
      }
    } else {
      this.notifications.emitToAdmins(TASK_COMMENT_EVENT, payload);
      await this.notificationsStore.createForAdmins({
        type: NotificationType.TASK_COMMENT_ADDED,
        title: `New comment on "${task.title}"`,
        message: `${actor.name?.trim() || actor.email} commented on a task`,
        data: payload,
      });
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import type { NotificationViewDto } from './dto/notification-view.dto';

type NotificationRow = Prisma.NotificationGetPayload<Record<string, never>>;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private toView(n: NotificationRow): NotificationViewDto {
    return {
      id: n.id,
      created_at: n.created_at,
      read_at: n.read_at,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data as Record<string, unknown>,
    };
  }

  async createForUser(params: {
    recipientId: string;
    type: NotificationType;
    title: string;
    message: string;
    data: unknown;
  }): Promise<void> {
    await this.prisma.notification.create({
      data: {
        recipient_id: params.recipientId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data as Prisma.InputJsonValue,
      },
    });
  }

  async createForAdmins(params: {
    type: NotificationType;
    title: string;
    message: string;
    data: unknown;
  }): Promise<void> {
    const admins = await this.prisma.user.findMany({
      where: { deleted_at: null, role: 'ADMIN' },
      select: { id: true },
    });
    if (!admins.length) return;
    await this.prisma.notification.createMany({
      data: admins.map((a) => ({
        recipient_id: a.id,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data as Prisma.InputJsonValue,
      })),
    });
  }

  async listForUser(
    userId: string,
    query: ListNotificationsQueryDto,
  ): Promise<{
    items: NotificationViewDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.NotificationWhereInput = {
      recipient_id: userId,
      ...(query.unreadOnly ? { read_at: null } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return { items: rows.map((r) => this.toView(r)), total, page, limit };
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    const row = await this.prisma.notification.findFirst({
      where: { id: notificationId, recipient_id: userId },
      select: { id: true, read_at: true },
    });
    if (!row) throw new NotFoundException('Notification not found');
    if (row.read_at) return;
    await this.prisma.notification.update({
      where: { id: row.id },
      data: { read_at: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { recipient_id: userId, read_at: null },
      data: { read_at: new Date() },
    });
    return { updated: result.count };
  }
}

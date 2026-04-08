import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
import type { AuditLogViewDto } from './dto/audit-log-view.dto';

const actorSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
} satisfies Prisma.UserSelect;

type AuditRow = Prisma.AuditLogGetPayload<{
  include: { actor: { select: typeof actorSelect } };
}>;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async append(params: {
    actorId: string;
    action: AuditAction;
    entityId: string;
    taskId: string | null;
    payload: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actor_id: params.actorId,
        action: params.action,
        entity_type: 'task',
        entity_id: params.entityId,
        task_id: params.taskId,
        payload: params.payload as Prisma.InputJsonValue,
      },
    });
  }

  private toView(row: AuditRow): AuditLogViewDto {
    return {
      id: row.id,
      created_at: row.created_at,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      task_id: row.task_id,
      actor: {
        id: row.actor.id,
        email: row.actor.email,
        name: row.actor.name,
        role: row.actor.role as AuditLogViewDto['actor']['role'],
      },
      payload: row.payload as Record<string, unknown>,
    };
  }

  async findAllForAdmin(query: ListAuditLogsQueryDto): Promise<{
    items: AuditLogViewDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where = {};

    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: actorSelect } },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: rows.map((r) => this.toView(r)),
      total,
      page,
      limit,
    };
  }
}

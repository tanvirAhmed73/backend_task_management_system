import { ApiProperty } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';
import type { AuthUserRole } from '../../auth/types/auth-user-role.type';

export class AuditLogActorViewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true })
  name!: string | null;

  @ApiProperty({ enum: ['ADMIN', 'USER'] })
  role!: AuthUserRole;
}

export class AuditLogViewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty({ enum: AuditAction })
  action!: AuditAction;

  @ApiProperty({ example: 'task' })
  entity_type!: string;

  @ApiProperty({ description: 'Target entity id (task id for task events)' })
  entity_id!: string;

  @ApiProperty({ nullable: true, description: 'Task id when applicable' })
  task_id!: string | null;

  @ApiProperty({ type: AuditLogActorViewDto })
  actor!: AuditLogActorViewDto;

  @ApiProperty({
    description:
      'Structured data; always includes `summary` (human-readable line for tables). May include `before` / `after` objects.',
    type: 'object',
    additionalProperties: true,
  })
  payload!: Record<string, unknown>;
}

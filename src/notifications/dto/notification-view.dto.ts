import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotificationViewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty({ nullable: true })
  read_at!: Date | null;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  data!: Record<string, unknown>;
}

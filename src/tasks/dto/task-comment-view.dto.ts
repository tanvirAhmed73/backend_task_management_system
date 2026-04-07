import { ApiProperty } from '@nestjs/swagger';
import type { AuthUserRole } from '../../auth/types/auth-user-role.type';

export class TaskCommentAuthorViewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true })
  name!: string | null;

  @ApiProperty({ enum: ['ADMIN', 'USER'] })
  role!: AuthUserRole;
}

export class TaskCommentViewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty()
  updated_at!: Date;

  @ApiProperty({ type: TaskCommentAuthorViewDto })
  author!: TaskCommentAuthorViewDto;
}

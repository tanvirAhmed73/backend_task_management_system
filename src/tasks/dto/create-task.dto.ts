import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Ship v1 release' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  @ApiProperty({ example: 'Finalize checklist and deploy.' })
  @IsString()
  @MinLength(1)
  @MaxLength(50_000)
  description!: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.PENDING })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'User id (cuid) to assign; omit for unassigned',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  assignee_id?: string;
}

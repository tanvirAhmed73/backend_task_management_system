import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { AuthUserRole } from '../../auth/types/auth-user-role.type';

export class CreateUserDto {
  @ApiProperty({ example: 'new.user@company.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;

  @ApiPropertyOptional({ example: 'Jane Doe', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    enum: ['USER', 'ADMIN'],
    default: 'USER',
    description:
      'Defaults to USER. Set ADMIN only when intentionally creating another administrator.',
  })
  @IsOptional()
  @IsIn(['USER', 'ADMIN'])
  role?: AuthUserRole;
}

import { ApiProperty } from '@nestjs/swagger';
import type { AuthUserRole } from '../types/auth-user-role.type';

export class AuthUserViewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: ['ADMIN', 'USER'] })
  role!: AuthUserRole;

  @ApiProperty({ required: false, nullable: true })
  name!: string | null;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'Bearer access token (use Authorization: Bearer <token>)',
  })
  access_token!: string;

  @ApiProperty({ type: AuthUserViewDto })
  user!: AuthUserViewDto;
}

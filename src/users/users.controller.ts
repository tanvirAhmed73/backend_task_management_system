import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { AuthUserViewDto } from '../auth/dto/login-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  @AuthRoles('ADMIN')
  @ApiOperation({
    summary: 'Create a user (admin only)',
    description:
      'Creates a user with a bcrypt-hashed password. Default role is USER.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ type: AuthUserViewDto })
  @ApiConflictResponse({ description: 'Email already registered' })
  async create(@Body() dto: CreateUserDto): Promise<AuthUserViewDto> {
    return this.users.createByAdmin(dto);
  }
}

import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUserViewDto } from '../auth/dto/login-response.dto';
import type { SafeUser } from '../auth/types/safe-user.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @AuthRoles('ADMIN')
  @ApiOperation({
    summary: 'List users (admin only)',
    description:
      'Returns all non-deleted users (id, email, name, role). Use ids as assignee_id when creating or updating tasks.',
  })
  @ApiOkResponse({ type: AuthUserViewDto, isArray: true })
  findAll(): Promise<AuthUserViewDto[]> {
    return this.users.findAllActiveForAdmin();
  }

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
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() admin: SafeUser,
  ): Promise<AuthUserViewDto> {
    return this.users.createByAdmin(dto, {
      email: admin.email,
      name: admin.name,
    });
  }
}

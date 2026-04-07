import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { SafeUser } from '../auth/types/safe-user.type';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { TaskViewDto } from './dto/task-view.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @AuthRoles('ADMIN', 'USER')
  @ApiOperation({ summary: 'Create a task' })
  @ApiCreatedResponse({ type: TaskViewDto })
  async create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: SafeUser,
  ): Promise<TaskViewDto> {
    return this.tasks.create(dto, user);
  }

  @Get()
  @AuthRoles('ADMIN', 'USER')
  @ApiOperation({
    summary: 'List active tasks',
    description: 'Returns non-deleted tasks, newest activity first.',
  })
  @ApiOkResponse({ type: TaskViewDto, isArray: true })
  findAll(@Query() query: ListTasksQueryDto): Promise<TaskViewDto[]> {
    return this.tasks.findAll(query);
  }

  @Get(':id')
  @AuthRoles('ADMIN', 'USER')
  @ApiOperation({ summary: 'Get one task' })
  @ApiOkResponse({ type: TaskViewDto })
  @ApiNotFoundResponse({ description: 'Task not found or deleted' })
  findOne(@Param('id') id: string): Promise<TaskViewDto> {
    return this.tasks.findOne(id);
  }

  @Patch(':id')
  @AuthRoles('ADMIN', 'USER')
  @ApiOperation({
    summary: 'Update a task',
    description:
      'ADMIN: any task. USER: only tasks you created or are assigned to.',
  })
  @ApiOkResponse({ type: TaskViewDto })
  @ApiNotFoundResponse({ description: 'Task not found or deleted' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: SafeUser,
  ): Promise<TaskViewDto> {
    return this.tasks.update(id, dto, user);
  }

  @Delete(':id')
  @AuthRoles('ADMIN', 'USER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete a task',
    description:
      'ADMIN: any task. USER: only tasks you created.',
  })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Task not found or deleted' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: SafeUser,
  ): Promise<void> {
    return this.tasks.remove(id, user);
  }
}

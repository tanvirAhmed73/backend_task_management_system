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
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { SafeUser } from '../auth/types/safe-user.type';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { TaskCommentViewDto } from './dto/task-comment-view.dto';
import { TaskViewDto } from './dto/task-view.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskCommentsService } from './task-comments.service';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasks: TasksService,
    private readonly taskComments: TaskCommentsService,
  ) {}

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

  @Get(':taskId/comments')
  @AuthRoles('ADMIN', 'USER')
  @ApiOperation({
    summary: 'List comments on a task',
    description:
      'ADMIN: any task. USER: only tasks you created or are assigned to. Oldest first.',
  })
  @ApiOkResponse({ type: TaskCommentViewDto, isArray: true })
  @ApiForbiddenResponse({ description: 'Not assignee, creator, or admin' })
  @ApiNotFoundResponse({ description: 'Task not found or deleted' })
  listComments(
    @Param('taskId') taskId: string,
    @CurrentUser() user: SafeUser,
  ): Promise<TaskCommentViewDto[]> {
    return this.taskComments.findAllForTask(taskId, user);
  }

  @Post(':taskId/comments')
  @AuthRoles('ADMIN', 'USER')
  @ApiOperation({
    summary: 'Add a comment on a task',
    description:
      'ADMIN: any task. USER: only tasks you created or are assigned to. Triggers WebSocket `task:comment` to admins (user comment) or assignee+creator (admin comment).',
  })
  @ApiCreatedResponse({ type: TaskCommentViewDto })
  @ApiForbiddenResponse({ description: 'Not assignee, creator, or admin' })
  @ApiNotFoundResponse({ description: 'Task not found or deleted' })
  addComment(
    @Param('taskId') taskId: string,
    @Body() dto: CreateTaskCommentDto,
    @CurrentUser() user: SafeUser,
  ): Promise<TaskCommentViewDto> {
    return this.taskComments.create(taskId, dto, user);
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
    description: 'ADMIN: any task. USER: only tasks you created.',
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

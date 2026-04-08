import { Controller, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { SafeUser } from '../auth/types/safe-user.type';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationViewDto } from './dto/notification-view.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @AuthRoles('ADMIN', 'USER')
  @ApiOperation({ summary: 'List current user notifications' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { $ref: '#/components/schemas/NotificationViewDto' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  list(
    @CurrentUser() user: SafeUser,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<{
    items: NotificationViewDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.notifications.listForUser(user.id, query);
  }

  @Patch(':id/read')
  @AuthRoles('ADMIN', 'USER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(
    @CurrentUser() user: SafeUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.notifications.markRead(user.id, id);
  }

  @Patch('read-all')
  @AuthRoles('ADMIN', 'USER')
  @ApiOperation({ summary: 'Mark all current user notifications as read' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        updated: { type: 'number' },
      },
    },
  })
  markAllRead(@CurrentUser() user: SafeUser): Promise<{ updated: number }> {
    return this.notifications.markAllRead(user.id);
  }
}

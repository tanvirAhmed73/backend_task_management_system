import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TaskCommentsService } from './task-comments.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [AuthModule, NotificationsModule, MailModule],
  controllers: [TasksController],
  providers: [TasksService, TaskCommentsService],
  exports: [TasksService],
})
export class TasksModule {}

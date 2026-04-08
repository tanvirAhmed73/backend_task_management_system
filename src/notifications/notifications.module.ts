import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsBusService } from './notifications-bus.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsBusService, NotificationsGateway, NotificationsService],
  exports: [NotificationsBusService, NotificationsService],
})
export class NotificationsModule {}

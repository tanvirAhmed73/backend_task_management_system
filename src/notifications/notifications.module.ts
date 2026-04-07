import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsBusService } from './notifications-bus.service';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  imports: [AuthModule],
  providers: [NotificationsBusService, NotificationsGateway],
  exports: [NotificationsBusService],
})
export class NotificationsModule {}

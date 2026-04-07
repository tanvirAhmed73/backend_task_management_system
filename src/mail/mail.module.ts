import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailJobsService } from './email-jobs.service';
import { EmailProcessor } from './email.processor';
import { EMAIL_QUEUE } from './mail.types';
import { MailService } from './mail.service';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
  ],
  providers: [MailService, EmailProcessor, EmailJobsService],
  exports: [MailService, EmailJobsService],
})
export class MailModule {}

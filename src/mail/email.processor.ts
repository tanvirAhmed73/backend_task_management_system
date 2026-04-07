import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  EMAIL_JOB_TASK_ASSIGNED,
  EMAIL_JOB_TASK_COMPLETED,
  EMAIL_JOB_WELCOME,
  EMAIL_QUEUE,
  type TaskAssignedEmailJobData,
  type TaskCompletedEmailJobData,
  type WelcomeEmailJobData,
} from './mail.types';
import { MailService } from './mail.service';

@Processor(EMAIL_QUEUE, { concurrency: 3 })
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mail: MailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case EMAIL_JOB_WELCOME:
        await this.mail.sendWelcomeEmail(job.data as WelcomeEmailJobData);
        return;
      case EMAIL_JOB_TASK_ASSIGNED:
        await this.mail.sendTaskAssignedEmail(
          job.data as TaskAssignedEmailJobData,
        );
        return;
      case EMAIL_JOB_TASK_COMPLETED:
        await this.mail.sendTaskCompletedEmail(
          job.data as TaskCompletedEmailJobData,
        );
        return;
      default:
        this.logger.warn(`Unknown email job name: ${job.name}`);
    }
  }
}

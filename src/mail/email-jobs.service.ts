import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  EMAIL_JOB_TASK_ASSIGNED,
  EMAIL_JOB_TASK_COMPLETED,
  EMAIL_JOB_WELCOME,
  EMAIL_QUEUE,
  type TaskAssignedEmailJobData,
  type TaskCompletedEmailJobData,
  type WelcomeEmailJobData,
} from './mail.types';

const defaultJobOpts = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 3000 },
  removeOnComplete: 200,
  removeOnFail: 500,
};

@Injectable()
export class EmailJobsService {
  constructor(@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue) {}

  async enqueueWelcomeCredentials(data: WelcomeEmailJobData): Promise<void> {
    await this.emailQueue.add(EMAIL_JOB_WELCOME, data, defaultJobOpts);
  }

  async enqueueTaskAssigned(data: TaskAssignedEmailJobData): Promise<void> {
    await this.emailQueue.add(EMAIL_JOB_TASK_ASSIGNED, data, defaultJobOpts);
  }

  async enqueueTaskCompletedNotice(data: TaskCompletedEmailJobData): Promise<void> {
    await this.emailQueue.add(EMAIL_JOB_TASK_COMPLETED, data, defaultJobOpts);
  }
}

export interface WelcomeEmailJobData {
  toEmail: string;
  recipientName: string | null;
  loginEmail: string;
  temporaryPassword: string;
  invitedByName: string | null;
  invitedByEmail: string;
}

export interface TaskAssignedEmailJobData {
  toEmail: string;
  recipientName: string | null;
  taskId: string;
  taskTitle: string;
  taskStatus: string;
  assignerName: string | null;
  assignerEmail: string;
}

export const EMAIL_QUEUE = 'email' as const;
export const EMAIL_JOB_WELCOME = 'welcome' as const;
export const EMAIL_JOB_TASK_ASSIGNED = 'task_assigned' as const;

export interface TaskCompletedEmailJobData {
  toEmail: string;
  adminRecipientName: string | null;
  taskId: string;
  taskTitle: string;
  completedByName: string | null;
  completedByEmail: string;
}

export const EMAIL_JOB_TASK_COMPLETED = 'task_completed' as const;

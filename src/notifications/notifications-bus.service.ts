import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';

/** Outbound WebSocket payloads (document for frontend). */
export interface TaskAssignedNotificationPayload {
  type: 'TASK_ASSIGNED';
  message: string;
  task: {
    id: string;
    title: string;
    status: string;
  };
  assignedBy: {
    id: string;
    email: string;
    name: string | null;
  };
}

export const TASK_ASSIGNED_EVENT = 'task:assigned' as const;

/** All connected ADMIN JWTs join this room (see NotificationsGateway). */
export const ADMINS_NOTIFICATION_ROOM = 'role:admin' as const;

export interface TaskCompletedNotificationPayload {
  type: 'TASK_COMPLETED';
  message: string;
  task: {
    id: string;
    title: string;
    status: string;
  };
  completedBy: {
    id: string;
    email: string;
    name: string | null;
  };
}

export const TASK_COMPLETED_EVENT = 'task:completed' as const;

export interface TaskCommentNotificationPayload {
  type: 'TASK_COMMENT_ADDED';
  task: {
    id: string;
    title: string;
  };
  comment: {
    id: string;
    body: string;
    created_at: string;
    author: {
      id: string;
      email: string;
      name: string | null;
      role: string;
    };
  };
}

/** Fired when someone adds a comment; recipients depend on author role (see API docs). */
export const TASK_COMMENT_EVENT = 'task:comment' as const;

/**
 * Holds the Socket.IO server once the gateway boots so HTTP services can emit
 * without depending on the gateway class.
 */
@Injectable()
export class NotificationsBusService {
  private server: Server | null = null;

  registerServer(server: Server): void {
    this.server = server;
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    if (!this.server) return;
    void this.server.to(roomForUser(userId)).emit(event, payload);
  }

  emitToAdmins(event: string, payload: unknown): void {
    if (!this.server) return;
    void this.server.to(ADMINS_NOTIFICATION_ROOM).emit(event, payload);
  }
}

export function roomForUser(userId: string): string {
  return `user:${userId}`;
}

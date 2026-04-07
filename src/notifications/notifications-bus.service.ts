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
}

export function roomForUser(userId: string): string {
  return `user:${userId}`;
}

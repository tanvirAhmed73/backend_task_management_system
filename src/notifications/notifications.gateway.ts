import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsBusService, roomForUser } from './notifications-bus.service';

const NOTIFICATIONS_NAMESPACE = '/notifications';

function extractBearerToken(client: Socket): string | null {
  const auth = client.handshake.auth as { token?: unknown };
  if (typeof auth?.token === 'string' && auth.token.trim() !== '') {
    return auth.token.trim();
  }
  const header = client.handshake.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  const q = client.handshake.query.token;
  if (typeof q === 'string' && q.trim() !== '') return q.trim();
  if (Array.isArray(q) && typeof q[0] === 'string') return q[0].trim();
  return null;
}

@WebSocketGateway({
  namespace: NOTIFICATIONS_NAMESPACE,
  cors: { origin: true, credentials: true },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly bus: NotificationsBusService,
  ) {}

  afterInit(server: Server): void {
    this.bus.registerServer(server);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Disconnected ${client.id}`);
  }

  async handleConnection(client: Socket): Promise<void> {
    const token = extractBearerToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      const row = await this.prisma.user.findFirst({
        where: { id: payload.sub, deleted_at: null },
        select: { id: true, role: true },
      });
      if (!row || row.role !== payload.role) {
        client.disconnect(true);
        return;
      }
      await client.join(roomForUser(payload.sub));
      this.logger.debug(`Client ${client.id} joined ${roomForUser(payload.sub)}`);
    } catch {
      client.disconnect(true);
    }
  }
}

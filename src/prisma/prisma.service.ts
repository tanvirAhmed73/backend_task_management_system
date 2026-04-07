import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma ORM 6 no longer exposes `$use` middleware on the generated client.
 * For global soft-delete behavior, use Client Extensions (`$extends`) instead.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly config: ConfigService) {
    super({
      log: [{ emit: 'event', level: 'query' }],
    });
  }

  async onModuleInit(): Promise<void> {
    this.config.getOrThrow<string>('DATABASE_URL');
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

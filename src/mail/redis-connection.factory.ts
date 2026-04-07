import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export function createRedisConnection(config: ConfigService): Redis {
  const url = config.get<string>('redis.url');
  const base = { maxRetriesPerRequest: null } as const;
  if (url) {
    return new Redis(url, base);
  }
  return new Redis({
    host: config.get<string>('redis.host'),
    port: config.get<number>('redis.port'),
    password: config.get<string>('redis.password'),
    ...base,
  });
}

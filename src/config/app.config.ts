function parseBcryptRounds(raw: string | undefined): number {
  const fallback = 12;
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 10 || n > 15) {
    return fallback;
  }
  return n;
}

export default () => ({
  app: {
    name: process.env.APP_NAME || 'backend_task_management_system',
    port: Number.parseInt(process.env.PORT ?? '', 10) || 5000,
    jwt: {
      secret: process.env.JWT_SECRET ?? '',
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    },
    password: {
      bcryptRounds: parseBcryptRounds(process.env.BCRYPT_ROUNDS),
    },
  },
  redis: {
    url: (process.env.REDIS_URL ?? '').trim(),
    host: (process.env.REDIS_HOST ?? '127.0.0.1').trim(),
    port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10) || 6379,
    password: (process.env.REDIS_PASSWORD ?? '').trim() || undefined,
  },
  mail: {
    host: (process.env.SMTP_HOST ?? '').trim(),
    port: Number.parseInt(process.env.SMTP_PORT ?? '587', 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: (process.env.SMTP_USER ?? '').trim(),
    pass: (process.env.SMTP_PASS ?? '').trim(),
    from: (process.env.MAIL_FROM ?? 'Task Management <noreply@localhost>').trim(),
    frontendLoginUrl: (process.env.FRONTEND_LOGIN_URL ?? '').trim(),
  },
});

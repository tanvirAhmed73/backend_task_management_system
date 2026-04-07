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
});

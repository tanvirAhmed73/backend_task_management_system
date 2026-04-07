import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function bcryptRounds(): number {
  const raw = process.env.BCRYPT_ROUNDS;
  const fallback = 12;
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 10 || n > 15) return fallback;
  return n;
}

async function main(): Promise<void> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const userEmail = process.env.SEED_USER_EMAIL?.trim();
  const userPassword = process.env.SEED_USER_PASSWORD;

  if (!adminEmail || !adminPassword || !userEmail || !userPassword) {
    throw new Error(
      'Seed requires SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_USER_EMAIL, SEED_USER_PASSWORD in the environment.',
    );
  }

  const rounds = bcryptRounds();
  const adminHash = await bcrypt.hash(adminPassword, rounds);
  const userHash = await bcrypt.hash(userPassword, rounds);

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: 'Administrator',
      password_hash: adminHash,
      role: UserRole.ADMIN,
    },
    update: {
      name: 'Administrator',
      password_hash: adminHash,
      role: UserRole.ADMIN,
      deleted_at: null,
    },
  });

  await prisma.user.upsert({
    where: { email: userEmail },
    create: {
      email: userEmail,
      name: 'Standard User',
      password_hash: userHash,
      role: UserRole.USER,
    },
    update: {
      name: 'Standard User',
      password_hash: userHash,
      role: UserRole.USER,
      deleted_at: null,
    },
  });
}

void main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { PrismaClient } from 'generated/prisma/client';
import { execSync } from 'node:child_process';

export function setupPrismaTests() {
  execSync('NODE_ENV=test prisma migrate reset --force"');
}

export async function clearDatabase(prisma: PrismaClient): Promise<void> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('clearDatabase só pode rodar em NODE_ENV=test');
  }

  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "users" RESTART IDENTITY CASCADE',
  );
}

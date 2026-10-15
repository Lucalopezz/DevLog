import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@generated/prisma/client';
import { getE2eUserCleanupFilter } from '@/shared/infrastructure/database/__tests__/e2e-user-cleanup';

async function main() {
  // Match migrate deploy's environment resolution instead of trusting a shell URL
  // that could point at a different database from the running test API.
  dotenv.config({ path: '.env.test', override: true, quiet: true });
  const where = getE2eUserCleanupFilter({
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    userIds: process.argv.slice(2).filter((argument) => argument !== '--'),
  });
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const result = await prisma.user.deleteMany({ where });
    console.info(`Removed ${result.count} tracked E2E account(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'E2E cleanup failed.');
  process.exitCode = 1;
});

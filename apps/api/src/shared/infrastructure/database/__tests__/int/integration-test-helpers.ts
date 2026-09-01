import dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';

dotenv.config({ path: '.env.test', quiet: true });

export function createIntegrationPrisma(): PrismaService {
  return new PrismaService(
    new ConfigService({
      DATABASE_URL: process.env.DATABASE_URL,
    }),
  );
}

export function clearIntegrationDatabase(
  prisma: PrismaService,
): Promise<unknown> {
  return prisma.user.deleteMany();
}

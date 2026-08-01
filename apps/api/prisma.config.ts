import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

const envFilePath = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

dotenv.config({
  path: envFilePath,
  override: true,
});

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});

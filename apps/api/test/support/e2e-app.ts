import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { applyGlobalConfig } from '@/global-config';
import { EnvConfigService } from '@/shared/infrastructure/env-config/env-config.service';

export type E2eUser = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export async function createE2eApp(): Promise<INestApplication<App>> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('HTTP E2E tests require NODE_ENV=test and .env.test.');
  }
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = module.createNestApplication<INestApplication<App>>();
  applyGlobalConfig(app, app.get(EnvConfigService));
  await app.init();
  return app;
}

export async function registerE2eUser(
  app: INestApplication<App>,
  createdUserIds: string[],
): Promise<E2eUser> {
  const input = {
    name: 'Journal Reader',
    email: `e2e-${randomUUID()}@example.test`,
    password: 'test-password-123',
    confirmPassword: 'test-password-123',
  };
  const response = await request(app.getHttpServer())
    .post('/api/users')
    .send(input)
    .expect(201);
  const user = response.body as Omit<E2eUser, 'password'>;
  createdUserIds.push(user.id);
  return { ...user, password: input.password };
}

export async function loginE2eUser(app: INestApplication<App>, user: E2eUser) {
  const agent = request.agent(app.getHttpServer());
  await agent
    .post('/api/auth/login')
    .send({ email: user.email, password: user.password })
    .expect(200);
  return agent;
}

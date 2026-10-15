import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { ACCESS_TOKEN_COOKIE } from '@/auth/infrastructure/constants/auth.constants';
import {
  createE2eApp,
  loginE2eUser,
  registerE2eUser,
  type E2eUser,
} from './support/e2e-app';

describe('Real authentication and account settings (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let user: E2eUser;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    user = await registerE2eUser(app, createdUserIds);
  });
  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: createdUserIds.splice(0) } },
    });
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  it('rejects invalid registration without persisting a user and rejects duplicate emails', async () => {
    const email = `e2e-${randomUUID()}@example.test`;
    await request(app.getHttpServer())
      .post('/api/users')
      .send({
        name: 'Reader',
        email,
        password: 'secret123',
        confirmPassword: 'different',
      })
      .expect(422);
    await expect(
      prisma.user.findUnique({ where: { email } }),
    ).resolves.toBeNull();
    await request(app.getHttpServer())
      .post('/api/users')
      .send({
        name: user.name,
        email: user.email,
        password: user.password,
        confirmPassword: user.password,
      })
      .expect(409);
  });

  it('registers without a session, rejects wrong credentials, and authenticates with a real cookie', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.get('/api/users/me').expect(401);
    const rejected = await agent
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong-password' })
      .expect(401);
    expect(rejected.headers['set-cookie']).toBeUndefined();
    const login = await agent
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);
    const cookies = login.headers['set-cookie'] as unknown as string[];
    expect(
      cookies.some(
        (cookie) =>
          cookie.startsWith(`${ACCESS_TOKEN_COOKIE}=`) &&
          cookie.includes('HttpOnly') &&
          cookie.includes('SameSite=Lax') &&
          cookie.includes('Path=/'),
      ),
    ).toBe(true);
    expect(login.body).not.toHaveProperty('password');
    expect(login.body).not.toHaveProperty('passwordHash');
    expect(login.body).not.toHaveProperty('accessToken');
    const profile = await agent.get('/api/users/me').expect(200);
    expect(profile.body).toMatchObject({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    expect(profile.body).not.toHaveProperty('passwordHash');
  });

  it('rejects a malformed cookie and clears the authenticated browser session on logout', async () => {
    await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Cookie', `${ACCESS_TOKEN_COOKIE}=invalid-token`)
      .expect(401);
    const agent = await loginE2eUser(app, user);
    await agent.get('/api/users/me').expect(200);
    const logout = await agent.post('/api/auth/logout').expect(204);
    const cookies = logout.headers['set-cookie'] as unknown as string[];
    expect(
      cookies.some((cookie) => cookie.startsWith(`${ACCESS_TOKEN_COOKIE}=;`)),
    ).toBe(true);
    await agent.get('/api/users/me').expect(401);
  });

  it('persists the profile name and rejects non-editable fields', async () => {
    const agent = await loginE2eUser(app, user);
    await agent
      .patch('/api/users/me')
      .send({ name: 'Updated Reader', email: 'changed@example.test' })
      .expect(422);
    await agent
      .patch('/api/users/me')
      .send({ name: 'Updated Reader' })
      .expect(200);
    const profile = await agent.get('/api/users/me').expect(200);
    expect(profile.body).toMatchObject({
      id: user.id,
      name: 'Updated Reader',
      email: user.email,
    });
    expect(profile.body).not.toHaveProperty('passwordHash');
  });

  it('preserves the old password on rejected updates and accepts only the new password after success', async () => {
    const agent = await loginE2eUser(app, user);
    const input = {
      currentPassword: user.password,
      password: 'new-password-123',
      confirmPassword: 'new-password-123',
    };
    await agent
      .patch('/api/users/me/password')
      .send({ ...input, confirmPassword: 'different' })
      .expect(422);
    await agent
      .patch('/api/users/me/password')
      .send({ ...input, currentPassword: 'wrong-password' })
      .expect(422);
    await loginE2eUser(app, user);
    const updated = await agent
      .patch('/api/users/me/password')
      .send(input)
      .expect(200);
    expect(updated.body).not.toHaveProperty('passwordHash');
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(401);
    const newSession = await loginE2eUser(app, {
      ...user,
      password: input.password,
    });
    await newSession.get('/api/users/me').expect(200);
  });
});

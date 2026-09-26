import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { applyGlobalConfig } from '@/global-config';
import { EnvConfigService } from '@/shared/infrastructure/env-config/env-config.service';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { ACCESS_TOKEN_COOKIE } from '@/auth/infrastructure/constants/auth.constants';

const userId = '123e4567-e89b-42d3-a456-426614174110';
const projectId = '123e4567-e89b-42d3-a456-426614174111';
const otherUserId = '123e4567-e89b-42d3-a456-426614174112';
const otherProjectId = '123e4567-e89b-42d3-a456-426614174113';
const cookie = `${ACCESS_TOKEN_COOKIE}=environment-e2e-token`;

describe('project environments HTTP (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider('TokenProvider')
      .useValue({ verify: jest.fn().mockResolvedValue({ sub: userId }) })
      .compile();
    app = module.createNestApplication();
    applyGlobalConfig(app, {
      getCorsAllowedOrigins: () => [],
    } as unknown as EnvConfigService);
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.user.deleteMany({
      where: { id: { in: [userId, otherUserId] } },
    });
    await prisma.user.create({
      data: {
        id: userId,
        name: 'Owner',
        email: 'environment-http-owner@example.com',
        passwordHash: 'unused',
      },
    });
    await prisma.user.create({
      data: {
        id: otherUserId,
        name: 'Other',
        email: 'environment-http-other@example.com',
        passwordHash: 'unused',
      },
    });
    await prisma.project.create({
      data: { id: projectId, userId, name: 'DevLog' },
    });
    await prisma.project.create({
      data: {
        id: otherProjectId,
        userId: otherUserId,
        name: 'Private project',
      },
    });
  });
  afterAll(async () => {
    if (prisma)
      await prisma.user.deleteMany({
        where: { id: { in: [userId, otherUserId] } },
      });
    if (app) await app.close();
  });
  it('requires authentication and keeps the static global route distinct from project IDs', async () => {
    await request(app.getHttpServer())
      .get('/api/project/environments')
      .expect(401);
    const response = await request(app.getHttpServer())
      .get('/api/project/environments')
      .set('Cookie', cookie)
      .expect(200);
    expect(response.body).toMatchObject({ data: [], meta: { total: 0 } });
  });
  it('creates, lists, updates, and removes only owned environments', async () => {
    const payload = {
      name: ' Local Development ',
      category: 'LOCAL',
      operatingSystem: 'Ubuntu 24.04',
      runtime: 'Node.js',
      runtimeVersion: '22',
    };
    const created = await request(app.getHttpServer())
      .post(`/api/project/${projectId}/environments`)
      .set('Cookie', cookie)
      .send(payload)
      .expect(201);
    const environmentId = (created.body as { id: string }).id;
    expect(created.body).toMatchObject({
      projectId,
      projectName: 'DevLog',
      name: 'Local Development',
      category: 'LOCAL',
    });
    expect(created.body).not.toHaveProperty('normalizedName');
    await request(app.getHttpServer())
      .post(`/api/project/${projectId}/environments`)
      .set('Cookie', cookie)
      .send({ name: 'local development', category: 'LOCAL' })
      .expect(409);
    const global = await request(app.getHttpServer())
      .get('/api/project/environments?search=ubuntu&category=LOCAL&page=1')
      .set('Cookie', cookie)
      .expect(200);
    expect((global.body as { data: unknown[] }).data).toEqual([
      expect.objectContaining({ id: environmentId, projectName: 'DevLog' }),
    ]);
    await request(app.getHttpServer())
      .get(`/api/project/${otherProjectId}/environments`)
      .set('Cookie', cookie)
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/api/project/${projectId}/environments/${environmentId}`)
      .set('Cookie', cookie)
      .send({})
      .expect(422);
    await request(app.getHttpServer())
      .patch(`/api/project/${projectId}/environments/${environmentId}`)
      .set('Cookie', cookie)
      .send({ runtime: null })
      .expect(200);
    const listed = await request(app.getHttpServer())
      .get(`/api/project/${projectId}/environments`)
      .set('Cookie', cookie)
      .expect(200);
    expect((listed.body as { data: unknown[] }).data[0]).toMatchObject({
      id: environmentId,
      runtime: null,
    });
    await request(app.getHttpServer())
      .delete(`/api/project/${projectId}/environments/${environmentId}`)
      .set('Cookie', cookie)
      .expect(204);
  });

  it('keeps archived environments readable and blocks mutations', async () => {
    const created = await request(app.getHttpServer())
      .post(`/api/project/${projectId}/environments`)
      .set('Cookie', cookie)
      .send({ name: 'Production', category: 'PRODUCTION' })
      .expect(201);
    const environmentId = (created.body as { id: string }).id;
    await request(app.getHttpServer())
      .patch(`/api/project/${projectId}/archive`)
      .set('Cookie', cookie)
      .expect(200);
    const listed = await request(app.getHttpServer())
      .get(`/api/project/${projectId}/environments`)
      .set('Cookie', cookie)
      .expect(200);
    expect((listed.body as { data: unknown[] }).data).toEqual([
      expect.objectContaining({ id: environmentId }),
    ]);
    await request(app.getHttpServer())
      .post(`/api/project/${projectId}/environments`)
      .set('Cookie', cookie)
      .send({ name: 'Staging', category: 'STAGING' })
      .expect(422);
    await request(app.getHttpServer())
      .patch(`/api/project/${projectId}/environments/${environmentId}`)
      .set('Cookie', cookie)
      .send({ name: 'Changed' })
      .expect(422);
    await request(app.getHttpServer())
      .delete(`/api/project/${projectId}/environments/${environmentId}`)
      .set('Cookie', cookie)
      .expect(422);
  });
});

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { createE2eApp, loginE2eUser, registerE2eUser } from './support/e2e-app';

describe('Project todos (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const userIds: string[] = [];
  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
  });
  afterEach(async () => {
    await prisma.user.deleteMany({ where: { id: { in: userIds.splice(0) } } });
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  it('routes authenticated writes, hides foreign children, validates titles, and reads archived projects', async () => {
    const owner = await loginE2eUser(app, await registerE2eUser(app, userIds));
    const other = await loginE2eUser(app, await registerE2eUser(app, userIds));
    const project = await owner
      .post('/api/project')
      .send({ name: 'Todo project' })
      .expect(201);
    const otherProject = await owner
      .post('/api/project')
      .send({ name: 'Other project' })
      .expect(201);
    const projectId = (project.body as { id: string }).id;
    const otherProjectId = (otherProject.body as { id: string }).id;
    const base = `/api/project/${projectId}/todos`;
    await request(app.getHttpServer()).get(base).expect(401);
    await owner.post(base).send({ title: '   ' }).expect(422);
    const created = await owner
      .post(base)
      .send({ title: '  Ship feature  ' })
      .expect(201);
    const todoId = (created.body as { id: string }).id;
    expect(created.body).toMatchObject({
      projectId,
      title: 'Ship feature',
      completedAt: null,
    });
    await owner
      .get(base)
      .expect(200)
      .expect(
        ({ body }: { body: { data: unknown[]; meta: { total: number } } }) => {
          expect(body.data).toHaveLength(1);
          expect(body.meta.total).toBe(1);
        },
      );
    await other.get(base).expect(404);
    await other.post(base).send({ title: 'Stolen' }).expect(404);
    await other
      .patch(`${base}/${todoId}`)
      .send({ completed: true })
      .expect(404);
    await owner
      .patch(`/api/project/${otherProjectId}/todos/${todoId}`)
      .send({ completed: true })
      .expect(404);
    const done = await owner
      .patch(`${base}/${todoId}`)
      .send({ completed: true })
      .expect(200);
    const again = await owner
      .patch(`${base}/${todoId}`)
      .send({ completed: true })
      .expect(200);
    expect((done.body as { completedAt: string }).completedAt).toBe(
      (again.body as { completedAt: string }).completedAt,
    );
    await owner.patch(`/api/project/${projectId}/archive`).expect(200);
    await owner.get(base).expect(200);
    await owner.post(base).send({ title: 'Blocked' }).expect(422);
    await owner
      .patch(`${base}/${todoId}`)
      .send({ completed: false })
      .expect(422);
    await owner.delete(`${base}/${todoId}`).expect(422);
    await owner.patch(`/api/project/${projectId}/restore`).expect(200);
    await owner.delete(`${base}/${todoId}`).expect(204);
  });
});

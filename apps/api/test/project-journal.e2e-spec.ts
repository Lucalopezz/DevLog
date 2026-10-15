import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { createE2eApp, loginE2eUser, registerE2eUser } from './support/e2e-app';

describe('Project and journal journeys (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let owner: Awaited<ReturnType<typeof loginE2eUser>>;
  let other: Awaited<ReturnType<typeof loginE2eUser>>;
  let projectId: string;
  let entryId: string;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    owner = await loginE2eUser(app, await registerE2eUser(app, createdUserIds));
    other = await loginE2eUser(app, await registerE2eUser(app, createdUserIds));
    const project = await owner
      .post('/api/project')
      .send({ name: 'HTTP Journal' })
      .expect(201);
    projectId = (project.body as { id: string }).id;
    const entry = await owner
      .post('/api/technical-entry')
      .send({
        projectId,
        title: 'Investigate stale cache',
        type: 'ISSUE',
        context: 'A project card shows old data after saving.',
      })
      .expect(201);
    entryId = (entry.body as { id: string }).id;
  });
  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: createdUserIds.splice(0) } },
    });
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  it('records attempts and tags, resolves, reopens, archives, restores, and deletes an issue', async () => {
    const tag = await owner
      .post('/api/tag')
      .send({ name: 'Cache' })
      .expect(201);
    const tagId = (tag.body as { id: string }).id;
    await owner
      .post(`/api/technical-entry/${entryId}/tags`)
      .send({ tagId })
      .expect(201);
    const attempt = await owner
      .post(`/api/technical-entry/${entryId}/solution-attempts`)
      .send({
        description: 'Invalidate all journal collections',
        result: 'SUCCESSFUL',
      })
      .expect(201);
    const attemptId = (attempt.body as { id: string }).id;
    const resolved = await owner
      .patch(`/api/technical-entry/${entryId}/resolve`)
      .send({ conclusion: 'Refresh every cached representation.' })
      .expect(200);
    expect(resolved.body).toMatchObject({
      id: entryId,
      status: 'RESOLVED',
      conclusion: 'Refresh every cached representation.',
    });
    const detail = await owner
      .get(`/api/technical-entry/${entryId}`)
      .expect(200);
    expect((detail.body as { tags: { id: string }[] }).tags).toEqual([
      expect.objectContaining({ id: tagId }),
    ]);
    const filtered = await owner
      .get(`/api/technical-entry?tagId=${tagId}&status=RESOLVED`)
      .expect(200);
    expect(
      (filtered.body as { data: { id: string }[] }).data.map((item) => item.id),
    ).toEqual([entryId]);

    const reopened = await owner
      .patch(`/api/technical-entry/${entryId}/reopen`)
      .expect(200);
    expect(reopened.body).toMatchObject({ status: 'OPEN' });
    await owner.patch(`/api/technical-entry/${entryId}/archive`).expect(200);
    const active = await owner
      .get('/api/technical-entry?archivedAt=null')
      .expect(200);
    expect((active.body as { data: unknown[] }).data).toEqual([]);
    const archived = await owner
      .get('/api/technical-entry?archivedAt=not-null')
      .expect(200);
    expect(
      (archived.body as { data: { id: string }[] }).data.map((item) => item.id),
    ).toEqual([entryId]);
    await owner.patch(`/api/technical-entry/${entryId}/restore`).expect(200);
    const attempts = await owner
      .get(`/api/technical-entry/${entryId}/solution-attempts`)
      .expect(200);
    expect((attempts.body as { data: unknown[] }).data).toEqual([
      expect.objectContaining({ id: attemptId, result: 'SUCCESSFUL' }),
    ]);
    await owner.delete(`/api/technical-entry/${entryId}`).expect(204);
    await owner.get(`/api/technical-entry/${entryId}`).expect(404);
    await expect(
      prisma.solutionAttempt.count({ where: { technicalEntryId: entryId } }),
    ).resolves.toBe(0);
    await expect(
      prisma.technicalEntryTag.count({ where: { technicalEntryId: entryId } }),
    ).resolves.toBe(0);
  });

  it('isolates both collections and rejects access to another owner and their nested records', async () => {
    const command = await owner
      .post(`/api/project/${projectId}/commands`)
      .send({ title: 'Run tests', command: 'pnpm test' })
      .expect(201);
    const commandId = (command.body as { id: string }).id;
    for (const path of [
      `/api/project/${projectId}`,
      `/api/project/${projectId}/technical-entries`,
      `/api/project/${projectId}/commands/${commandId}`,
      `/api/technical-entry/${entryId}`,
      `/api/technical-entry/${entryId}/solution-attempts`,
    ])
      await other.get(path).expect(404);
    await other
      .patch(`/api/project/${projectId}`)
      .send({ name: 'Stolen project' })
      .expect(404);
    await other
      .patch(`/api/technical-entry/${entryId}`)
      .send({ title: 'Stolen entry' })
      .expect(404);
    await other
      .delete(`/api/project/${projectId}/commands/${commandId}`)
      .expect(404);
    await other.delete(`/api/technical-entry/${entryId}`).expect(404);
    await other
      .post('/api/technical-entry')
      .send({
        projectId,
        title: 'Foreign project entry',
        type: 'LEARNING',
        context: 'This must not be saved.',
      })
      .expect(404);
    for (const path of [
      '/api/project',
      '/api/technical-entry',
      '/api/project/technologies',
    ]) {
      const response = await other.get(path).expect(200);
      expect(response.body).toMatchObject({ data: [], meta: { total: 0 } });
    }
    const preserved = await owner
      .get(`/api/technical-entry/${entryId}`)
      .expect(200);
    expect(preserved.body).toMatchObject({
      title: 'Investigate stale cache',
      projectId,
    });
  });

  it('rejects invalid IDs, filters, and extra ownership fields without modifying records', async () => {
    await owner.get('/api/technical-entry/not-a-uuid').expect(422);
    await owner.get('/api/technical-entry?page=0').expect(422);
    await owner.get('/api/project?status=UNKNOWN').expect(422);
    await owner
      .patch(`/api/technical-entry/${entryId}`)
      .send({ title: 'Changed', userId: createdUserIds[1] })
      .expect(422);
    await owner
      .post('/api/project')
      .send({ name: 'Injected owner', userId: createdUserIds[1] })
      .expect(422);
    const preserved = await owner
      .get(`/api/technical-entry/${entryId}`)
      .expect(200);
    expect(preserved.body).toMatchObject({ title: 'Investigate stale cache' });
  });

  it('preserves linked journal entries when deleting a project and cascades its resources', async () => {
    await owner
      .post(`/api/project/${projectId}/resources`)
      .send({
        label: 'Source code',
        url: 'https://example.com/repository',
        type: 'REPOSITORY',
      })
      .expect(201);
    await owner.delete(`/api/project/${projectId}`).expect(204);
    await owner.get(`/api/project/${projectId}`).expect(404);
    const entry = await owner
      .get(`/api/technical-entry/${entryId}`)
      .expect(200);
    // Project deletion uses SetNull for journal history, and Cascade for resources.
    expect(
      (entry.body as { projectId?: string | null }).projectId ?? null,
    ).toBeNull();
    expect(entry.body).toMatchObject({
      id: entryId,
      title: 'Investigate stale cache',
    });
    await expect(
      prisma.projectResource.count({ where: { projectId } }),
    ).resolves.toBe(0);
  });
});

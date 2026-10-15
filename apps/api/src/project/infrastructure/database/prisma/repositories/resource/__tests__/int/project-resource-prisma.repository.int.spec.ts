import { randomUUID } from 'node:crypto';
import { ProjectResourceEntity } from '@/project/domain/entities/resource/project-resource.entity';
import { ProjectResourceType } from '@/project/domain/entities/resource/project-resource-type.enum';
import { ProjectResourceSearchParams } from '@/project/domain/repositories/resource/project-resource.repository';
import {
  clearIntegrationDatabase,
  createIntegrationPrisma,
} from '@/shared/infrastructure/database/__tests__/int/integration-test-helpers';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { ProjectResourcePrismaRepository } from '../../project-resource-prisma.repository';

const USER_ID = randomUUID();
const PROJECT_ID = randomUUID();
const OTHER_PROJECT_ID = randomUUID();

describe('ProjectResourcePrismaRepository (integration)', () => {
  let prisma: PrismaService;
  let repository: ProjectResourcePrismaRepository;

  beforeAll(async () => {
    prisma = createIntegrationPrisma();
    await prisma.$connect();
    repository = new ProjectResourcePrismaRepository(prisma);
  });

  beforeEach(async () => {
    await clearIntegrationDatabase(prisma);
    await prisma.user.create({
      data: {
        id: USER_ID,
        name: 'Resource owner',
        email: 'resource-owner@example.com',
        passwordHash: 'unused',
      },
    });
    await prisma.project.createMany({
      data: [
        { id: PROJECT_ID, userId: USER_ID, name: 'DevLog' },
        { id: OTHER_PROJECT_ID, userId: USER_ID, name: 'Other project' },
      ],
    });
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
  });

  function resource(
    overrides: Partial<
      ConstructorParameters<typeof ProjectResourceEntity>[0]
    > = {},
  ) {
    return new ProjectResourceEntity({
      projectId: PROJECT_ID,
      label: 'API reference',
      url: 'https://example.com/docs',
      type: ProjectResourceType.DOCUMENTATION,
      ...overrides,
    });
  }

  it('persists and updates an entity without losing its identity or creation date', async () => {
    const entity = resource();
    await repository.insert(entity);
    await expect(repository.findById(entity.id)).resolves.toBeInstanceOf(
      ProjectResourceEntity,
    );
    entity.update({
      label: 'Source code',
      url: 'https://example.com/repository',
      type: ProjectResourceType.REPOSITORY,
    });
    await repository.update(entity);

    await expect(repository.findById(entity.id)).resolves.toMatchObject({
      id: entity.id,
      projectId: PROJECT_ID,
      label: 'Source code',
      url: 'https://example.com/repository',
      type: ProjectResourceType.REPOSITORY,
      createdAt: entity.createdAt,
    });
    expect(await repository.findAll()).toHaveLength(1);
    await repository.delete(entity.id);
    await expect(repository.findById(entity.id)).resolves.toBeNull();
  });

  it('combines project, type, label and URL filters case-insensitively', async () => {
    const match = resource();
    for (const entity of [
      match,
      resource({
        url: 'https://example.com/docs/other',
        type: ProjectResourceType.OTHER,
      }),
      resource({ label: 'Guide', url: 'https://example.com/docs/guide' }),
      resource({ projectId: OTHER_PROJECT_ID }),
    ])
      await repository.insert(entity);

    const result = await repository.search(
      new ProjectResourceSearchParams({
        filter: {
          projectId: PROJECT_ID,
          label: 'API',
          url: '/DOCS',
          type: ProjectResourceType.DOCUMENTATION,
        },
      }),
    );
    expect(result.total).toBe(1);
    expect(result.items.map((item) => item.id)).toEqual([match.id]);
  });

  it('uses the filtered total on every sorted page and keeps an out-of-range page empty', async () => {
    const entities = [
      resource({ label: 'Beta', url: 'https://example.com/beta' }),
      resource({ label: 'Alpha', url: 'https://example.com/alpha' }),
      resource({ projectId: OTHER_PROJECT_ID }),
    ];
    for (const entity of entities) await repository.insert(entity);
    const params = {
      perPage: 1,
      sort: 'label',
      sortDir: 'asc' as const,
      filter: { projectId: PROJECT_ID },
    };
    const first = await repository.search(
      new ProjectResourceSearchParams({ ...params, page: 1 }),
    );
    const second = await repository.search(
      new ProjectResourceSearchParams({ ...params, page: 2 }),
    );
    const beyond = await repository.search(
      new ProjectResourceSearchParams({ ...params, page: 3 }),
    );

    expect(first.items.map((item) => item.label)).toEqual(['Alpha']);
    expect(second.items.map((item) => item.label)).toEqual(['Beta']);
    expect([first.total, second.total, beyond.total]).toEqual([2, 2, 2]);
    expect(beyond.items).toEqual([]);
  });

  it('falls back to newest-first ordering for an unsupported sort field', async () => {
    const older = resource({ createdAt: new Date('2026-10-01T12:00:00Z') });
    const newer = resource({
      url: 'https://example.com/newer',
      createdAt: new Date('2026-10-02T12:00:00Z'),
    });
    await repository.insert(older);
    await repository.insert(newer);

    const result = await repository.search(
      new ProjectResourceSearchParams({ sort: 'unknown' }),
    );
    expect(result.items.map((item) => item.id)).toEqual([newer.id, older.id]);
  });

  it('enforces URL uniqueness within a project while allowing the same URL elsewhere', async () => {
    await repository.insert(resource());
    await expect(repository.insert(resource())).rejects.toMatchObject({
      code: 'P2002',
    });
    await expect(
      repository.insert(resource({ projectId: OTHER_PROJECT_ID })),
    ).resolves.toBeUndefined();
  });

  it('requires a real parent project', async () => {
    await expect(
      repository.insert(resource({ projectId: randomUUID() })),
    ).rejects.toMatchObject({ code: 'P2003' });
  });

  it('cascades project deletion while preserving another project resources', async () => {
    const kept = resource({ projectId: OTHER_PROJECT_ID });
    await repository.insert(resource());
    await repository.insert(kept);
    await prisma.project.delete({ where: { id: PROJECT_ID } });

    expect((await repository.findAll()).map((item) => item.id)).toEqual([
      kept.id,
    ]);
  });
});

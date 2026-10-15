import { randomUUID } from 'node:crypto';
import { ProjectTechnologyEntity } from '@/project/domain/entities/technology/project-technology.entity';
import {
  clearIntegrationDatabase,
  createIntegrationPrisma,
} from '@/shared/infrastructure/database/__tests__/int/integration-test-helpers';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { ProjectTechnologyPrismaRepository } from '../../project-technology-prisma.repository';

const USER_ID = randomUUID();
const OTHER_USER_ID = randomUUID();
const PROJECT_ID = randomUUID();
const SECOND_PROJECT_ID = randomUUID();
const OTHER_PROJECT_ID = randomUUID();

describe('ProjectTechnologyPrismaRepository (integration)', () => {
  let prisma: PrismaService;
  let repository: ProjectTechnologyPrismaRepository;

  beforeAll(async () => {
    prisma = createIntegrationPrisma();
    await prisma.$connect();
    repository = new ProjectTechnologyPrismaRepository(prisma);
  });

  beforeEach(async () => {
    await clearIntegrationDatabase(prisma);
    await prisma.user.createMany({
      data: [
        {
          id: USER_ID,
          name: 'Owner',
          email: 'technology-owner@example.com',
          passwordHash: 'unused',
        },
        {
          id: OTHER_USER_ID,
          name: 'Other owner',
          email: 'technology-other@example.com',
          passwordHash: 'unused',
        },
      ],
    });
    await prisma.project.createMany({
      data: [
        { id: PROJECT_ID, userId: USER_ID, name: 'Alpha' },
        {
          id: SECOND_PROJECT_ID,
          userId: USER_ID,
          name: 'Beta',
          archivedAt: new Date(),
        },
        {
          id: OTHER_PROJECT_ID,
          userId: OTHER_USER_ID,
          name: 'Private project',
        },
      ],
    });
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
  });

  function technology(
    projectId = PROJECT_ID,
    name = 'TypeScript',
    version?: string,
  ) {
    return new ProjectTechnologyEntity({ projectId, name, version });
  }

  it('round-trips entities and finds technologies only in the requested project', async () => {
    const entity = technology(PROJECT_ID, 'TypeScript', '6');
    await repository.insert(entity);
    await repository.insert(technology(SECOND_PROJECT_ID, 'TypeScript'));

    await expect(repository.findById(entity.id)).resolves.toBeInstanceOf(
      ProjectTechnologyEntity,
    );
    await expect(
      repository.findByName(PROJECT_ID, 'TypeScript'),
    ).resolves.toMatchObject({
      id: entity.id,
      projectId: PROJECT_ID,
      version: '6',
    });
    expect(
      (await repository.findByProjectId(PROJECT_ID)).map((item) => item.id),
    ).toEqual([entity.id]);
    expect(await repository.findAll()).toHaveLength(2);
    await expect(repository.findById(randomUUID())).resolves.toBeNull();
    await expect(
      repository.findByName(PROJECT_ID, 'Missing'),
    ).resolves.toBeNull();
  });

  it('paginates the owner collection in project/name order, including archived projects', async () => {
    const alpha = technology(PROJECT_ID, 'Node.js');
    const beta = technology(PROJECT_ID, 'TypeScript');
    const archived = technology(SECOND_PROJECT_ID, 'PostgreSQL');
    for (const entity of [
      archived,
      beta,
      alpha,
      technology(OTHER_PROJECT_ID),
    ]) {
      await repository.insert(entity);
    }

    const first = await repository.searchForOwner({
      userId: USER_ID,
      page: 1,
      perPage: 2,
    });
    const second = await repository.searchForOwner({
      userId: USER_ID,
      page: 2,
      perPage: 2,
    });

    expect(first.total).toBe(3);
    expect(first.items.map((item) => item.id)).toEqual([alpha.id, beta.id]);
    expect(first.items[0].projectName).toBe('Alpha');
    expect(second.total).toBe(3);
    expect(second.items).toEqual([
      expect.objectContaining({ id: archived.id, projectName: 'Beta' }),
    ]);
  });

  it('combines case-insensitive name and project filters without leaking another owner', async () => {
    const match = technology(PROJECT_ID);
    await repository.insert(match);
    await repository.insert(technology(SECOND_PROJECT_ID));
    await repository.insert(technology(OTHER_PROJECT_ID));

    const filter = { userId: USER_ID, name: 'SCRIPT', page: 1, perPage: 10 };
    const result = await repository.searchForOwner({
      ...filter,
      projectId: PROJECT_ID,
    });
    expect(result.total).toBe(1);
    expect(result.items.map((item) => item.id)).toEqual([match.id]);
    await expect(
      repository.searchForOwner({ ...filter, projectId: OTHER_PROJECT_ID }),
    ).resolves.toEqual({ items: [], total: 0 });
  });

  it('enforces technology-name uniqueness per project', async () => {
    await repository.insert(technology());
    await expect(repository.insert(technology())).rejects.toMatchObject({
      code: 'P2002',
    });
    await expect(
      repository.insert(technology(SECOND_PROJECT_ID)),
    ).resolves.toBeUndefined();
  });

  it('requires a real parent project', async () => {
    await expect(
      repository.insert(technology(randomUUID())),
    ).rejects.toMatchObject({ code: 'P2003' });
  });

  it('updates persisted fields, clears an optional version, and deletes the record', async () => {
    const original = technology(PROJECT_ID, 'TypeScript', '5');
    await repository.insert(original);
    // Rehydrate a new state because technologies currently expose no update method.
    const updated = new ProjectTechnologyEntity(
      {
        projectId: PROJECT_ID,
        name: 'Node.js',
        createdAt: original.createdAt,
      },
      original.id,
    );
    await repository.update(updated);

    await expect(repository.findById(original.id)).resolves.toMatchObject({
      name: 'Node.js',
      version: undefined,
    });
    expect(
      (
        await prisma.projectTechnology.findUniqueOrThrow({
          where: { id: original.id },
        })
      ).version,
    ).toBeNull();
    await repository.delete(original.id);
    await expect(repository.findById(original.id)).resolves.toBeNull();
  });

  it('cascades project deletion without deleting technologies in another project', async () => {
    const kept = technology(SECOND_PROJECT_ID);
    await repository.insert(technology());
    await repository.insert(kept);
    await prisma.project.delete({ where: { id: PROJECT_ID } });

    expect((await repository.findAll()).map((item) => item.id)).toEqual([
      kept.id,
    ]);
  });
});

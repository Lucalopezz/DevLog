import { ProjectResourceType } from '@/project/domain/entities/resource/project-resource-type.enum';
import { ProjectResourceEntity } from '@/project/domain/entities/resource/project-resource.entity';
import { ProjectResourceSearchParams } from '@/project/domain/repositories/resource/project-resource.repository';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { ProjectResourceType as PrismaProjectResourceType } from '@generated/prisma/client';
import { ProjectResourcePrismaRepository } from '../../project-resource-prisma.repository';

const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174000';
const RESOURCE_ID = '123e4567-e89b-42d3-a456-426614174001';

describe('ProjectResourcePrismaRepository', () => {
  const create = jest.fn().mockResolvedValue(undefined);
  const count = jest.fn().mockResolvedValue(0);
  const findMany = jest.fn().mockResolvedValue([]);
  const findUnique = jest.fn().mockResolvedValue(null);
  const update = jest.fn().mockResolvedValue(undefined);
  const deleteResource = jest.fn().mockResolvedValue(undefined);
  const prismaService = {
    projectResource: {
      create,
      count,
      findMany,
      findUnique,
      update,
      delete: deleteResource,
    },
  } as unknown as PrismaService;
  const repository = new ProjectResourcePrismaRepository(prismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeEntity(): ProjectResourceEntity {
    const createdAt = new Date('2026-08-01T00:00:00.000Z');

    return new ProjectResourceEntity(
      {
        projectId: PROJECT_ID,
        label: 'Documentation da API',
        url: 'https://docs.example.com/devlog',
        type: ProjectResourceType.DOCUMENTATION,
        createdAt,
        updatedAt: createdAt,
      },
      RESOURCE_ID,
    );
  }

  function makeModel() {
    const createdAt = new Date('2026-08-01T00:00:00.000Z');

    return {
      id: RESOURCE_ID,
      projectId: PROJECT_ID,
      label: 'Documentation da API',
      url: 'https://docs.example.com/devlog',
      type: PrismaProjectResourceType.DOCUMENTATION,
      createdAt,
      updatedAt: createdAt,
    };
  }

  it('declares only safe sorting fields', () => {
    expect(repository.sortableFields).toEqual([
      'label',
      'type',
      'createdAt',
      'updatedAt',
    ]);
  });

  it('inserts the entity converted to the Prisma model', async () => {
    const entity = makeEntity();

    await repository.insert(entity);

    expect(create).toHaveBeenCalledWith({
      data: {
        id: RESOURCE_ID,
        projectId: PROJECT_ID,
        label: 'Documentation da API',
        url: 'https://docs.example.com/devlog',
        type: PrismaProjectResourceType.DOCUMENTATION,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
    });
  });

  it('lists all resources converted to entities', async () => {
    findMany.mockResolvedValueOnce([makeModel()]);

    const result = await repository.findAll();

    expect(findMany).toHaveBeenCalledWith();
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ProjectResourceEntity);
    expect(result[0]).toMatchObject({
      id: RESOURCE_ID,
      projectId: PROJECT_ID,
      type: ProjectResourceType.DOCUMENTATION,
    });
  });

  it('finds by ID and converts the model to an entity', async () => {
    findUnique.mockResolvedValueOnce(makeModel());

    const result = await repository.findById(RESOURCE_ID);

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: RESOURCE_ID },
    });
    expect(result).toBeInstanceOf(ProjectResourceEntity);
    expect(result).toMatchObject({ id: RESOURCE_ID, projectId: PROJECT_ID });
  });

  it('returns null when no resource is found by ID', async () => {
    await expect(repository.findById(RESOURCE_ID)).resolves.toBeNull();

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: RESOURCE_ID },
    });
  });

  it('updates only mutable data and the update date', async () => {
    const entity = makeEntity();

    await repository.update(entity);

    expect(update).toHaveBeenCalledWith({
      where: { id: RESOURCE_ID },
      data: {
        label: 'Documentation da API',
        url: 'https://docs.example.com/devlog',
        type: PrismaProjectResourceType.DOCUMENTATION,
        updatedAt: entity.updatedAt,
      },
    });
  });

  it('removes the resource by ID', async () => {
    await repository.delete(RESOURCE_ID);

    expect(deleteResource).toHaveBeenCalledWith({
      where: { id: RESOURCE_ID },
    });
  });

  it('applies filters, pagination, and sorting and returns the typed result', async () => {
    count.mockResolvedValueOnce(1);
    findMany.mockResolvedValueOnce([makeModel()]);
    const params = new ProjectResourceSearchParams({
      page: 2,
      perPage: 10,
      sort: 'label',
      sortDir: 'asc',
      filter: {
        projectId: PROJECT_ID,
        label: 'documentation',
        url: 'docs.example.com',
        type: ProjectResourceType.DOCUMENTATION,
      },
    });

    const result = await repository.search(params);

    const where = {
      projectId: PROJECT_ID,
      label: { contains: 'documentation', mode: 'insensitive' },
      url: { contains: 'docs.example.com', mode: 'insensitive' },
      type: PrismaProjectResourceType.DOCUMENTATION,
    };
    expect(count).toHaveBeenCalledWith({ where });
    expect(findMany).toHaveBeenCalledWith({
      where,
      orderBy: { label: 'asc' },
      skip: 10,
      take: 10,
    });
    expect(result).toMatchObject({
      total: 1,
      currentPage: 2,
      perPage: 10,
      lastPage: 1,
      sort: 'label',
      sortDir: 'asc',
      filter: params.filter,
    });
    expect(result.items[0]).toBeInstanceOf(ProjectResourceEntity);
  });

  it('uses empty filters and default sorting for a disallowed sort', async () => {
    await repository.search(
      new ProjectResourceSearchParams({
        sort: 'url',
        sortDir: 'asc',
      }),
    );

    expect(count).toHaveBeenCalledWith({ where: {} });
    expect(findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 15,
    });
  });
});

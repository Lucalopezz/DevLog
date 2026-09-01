import { ProjectEntity } from '@/project/domain/entities/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project-status-enum';
import { ProjectSearchParams } from '@/project/domain/repositories/project.repository';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import {
  Project,
  ProjectStatus as PrismaProjectStatus,
} from '@generated/prisma/client';
import { ProjectPrismaRepository } from '../../project-prisma.repository';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174010';
const timestamp = new Date('2026-08-01T00:00:00.000Z');

function makeEntity(): ProjectEntity {
  return new ProjectEntity(
    {
      userId: USER_ID,
      name: 'DevLog',
      status: ProjectStatusEnum.ACTIVE,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    PROJECT_ID,
  );
}

function makeModel(): Project {
  return {
    id: PROJECT_ID,
    userId: USER_ID,
    name: 'DevLog',
    description: null,
    status: PrismaProjectStatus.ACTIVE,
    localPath: null,
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe('ProjectPrismaRepository', () => {
  const create = jest.fn();
  const count = jest.fn();
  const findMany = jest.fn();
  const findUnique = jest.fn();
  const update = jest.fn();
  const deleteProject = jest.fn();
  const prismaService = {
    project: {
      create,
      count,
      findMany,
      findUnique,
      update,
      delete: deleteProject,
    },
  } as unknown as PrismaService;
  const repository = new ProjectPrismaRepository(prismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    create.mockResolvedValue(undefined);
    count.mockResolvedValue(0);
    findMany.mockResolvedValue([]);
    findUnique.mockResolvedValue(null);
    update.mockResolvedValue(undefined);
    deleteProject.mockResolvedValue(undefined);
  });

  it('declara somente campos seguros para ordenação', () => {
    expect(repository.sortableFields).toEqual([
      'createdAt',
      'updatedAt',
      'name',
    ]);
  });

  it('insere a entidade convertida para persistência', async () => {
    await repository.insert(makeEntity());

    expect(create.mock.calls).toEqual([
      [
        {
          data: {
            id: PROJECT_ID,
            userId: USER_ID,
            name: 'DevLog',
            description: undefined,
            status: PrismaProjectStatus.ACTIVE,
            localPath: null,
            archivedAt: null,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        },
      ],
    ]);
  });

  it.each([
    ['todos', () => repository.findAll(), undefined],
    [
      'do proprietário',
      () => repository.findByOwnerId(USER_ID),
      { userId: USER_ID },
    ],
  ])('lista %s os projetos convertidos', async (_case, execute, where) => {
    findMany.mockResolvedValue([makeModel()]);

    await expect(execute()).resolves.toEqual([
      expect.objectContaining({
        id: PROJECT_ID,
        status: ProjectStatusEnum.ACTIVE,
      }),
    ]);
    expect(findMany.mock.calls[0]).toEqual(where ? [{ where }] : []);
  });

  it('busca por id e trata ausência', async () => {
    findUnique.mockResolvedValueOnce(makeModel()).mockResolvedValueOnce(null);

    await expect(repository.findById(PROJECT_ID)).resolves.toMatchObject({
      id: PROJECT_ID,
    });
    await expect(repository.findById('missing-id')).resolves.toBeNull();
  });

  it('atualiza os campos mutáveis e remove pelo id', async () => {
    const entity = makeEntity();

    await repository.update(entity);
    await repository.delete(PROJECT_ID);

    expect(update).toHaveBeenCalledWith({
      where: { id: PROJECT_ID },
      data: {
        name: 'DevLog',
        description: undefined,
        status: PrismaProjectStatus.ACTIVE,
        localPath: null,
        archivedAt: null,
        updatedAt: timestamp,
      },
    });
    expect(deleteProject).toHaveBeenCalledWith({ where: { id: PROJECT_ID } });
  });

  it('aplica filtros, paginação e ordenação permitida', async () => {
    count.mockResolvedValue(1);
    findMany.mockResolvedValue([makeModel()]);
    const archivedAt = new Date('2026-08-02T00:00:00.000Z');
    const params = new ProjectSearchParams({
      page: 2,
      perPage: 10,
      sort: 'name',
      sortDir: 'asc',
      filter: {
        userId: USER_ID,
        name: 'dev',
        archivedAt,
        status: ProjectStatusEnum.INACTIVE,
      },
    });

    const result = await repository.search(params);
    const where = {
      userId: USER_ID,
      name: { contains: 'dev', mode: 'insensitive' },
      archivedAt,
      status: PrismaProjectStatus.PAUSED,
    };
    expect(count).toHaveBeenCalledWith({ where });
    expect(findMany).toHaveBeenCalledWith({
      where,
      orderBy: { name: 'asc' },
      skip: 10,
      take: 10,
    });
    expect(result).toMatchObject({ total: 1, currentPage: 2, perPage: 10 });
  });

  it('usa filtro vazio e ordenação padrão para sort não permitido', async () => {
    await repository.search(new ProjectSearchParams({ sort: 'status' }));

    expect(findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 15,
    });
  });
});

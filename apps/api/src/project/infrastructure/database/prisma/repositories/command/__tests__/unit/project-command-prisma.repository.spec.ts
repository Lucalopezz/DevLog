import { ProjectCommandEntity } from '@/project/domain/entities/command/project-command.entity';
import { ProjectCommandSearchParams } from '@/project/domain/repositories/command/project-command.repository';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { ProjectCommand } from '@generated/prisma/client';
import { ProjectCommandPrismaRepository } from '../../project-command-prisma.repository';

const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174010';
const COMMAND_ID = '123e4567-e89b-42d3-a456-426614174020';
const timestamp = new Date('2026-08-01T00:00:00.000Z');

function makeEntity(): ProjectCommandEntity {
  return new ProjectCommandEntity(
    {
      projectId: PROJECT_ID,
      title: 'Start API',
      command: 'pnpm --filter api dev',
      description: 'Starts Nest in watch mode',
      executionOrder: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    COMMAND_ID,
  );
}

function makeModel(): ProjectCommand {
  return {
    id: COMMAND_ID,
    projectId: PROJECT_ID,
    title: 'Start API',
    command: 'pnpm --filter api dev',
    description: 'Starts Nest in watch mode',
    executionOrder: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe('ProjectCommandPrismaRepository', () => {
  const create = jest.fn();
  const count = jest.fn();
  const findMany = jest.fn();
  const findUnique = jest.fn();
  const update = jest.fn();
  const deleteCommand = jest.fn();
  const prismaService = {
    projectCommand: {
      create,
      count,
      findMany,
      findUnique,
      update,
      delete: deleteCommand,
    },
  } as unknown as PrismaService;
  const repository = new ProjectCommandPrismaRepository(prismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    create.mockResolvedValue(undefined);
    count.mockResolvedValue(0);
    findMany.mockResolvedValue([]);
    findUnique.mockResolvedValue(null);
    update.mockResolvedValue(undefined);
    deleteCommand.mockResolvedValue(undefined);
  });

  it('declara somente campos seguros para ordenação', () => {
    expect(repository.sortableFields).toEqual([
      'title',
      'executionOrder',
      'createdAt',
      'updatedAt',
    ]);
  });

  it('executa CRUD convertendo modelos e entidades', async () => {
    const entity = makeEntity();
    findMany.mockResolvedValue([makeModel()]);
    findUnique.mockResolvedValue(makeModel());

    await repository.insert(entity);
    await expect(repository.findAll()).resolves.toEqual([
      expect.objectContaining({ id: COMMAND_ID }),
    ]);
    await expect(repository.findById(COMMAND_ID)).resolves.toMatchObject({
      id: COMMAND_ID,
    });
    await repository.update(entity);
    await repository.delete(COMMAND_ID);

    expect(create.mock.calls).toEqual([
      [
        {
          data: {
            id: COMMAND_ID,
            projectId: PROJECT_ID,
            title: 'Start API',
            command: 'pnpm --filter api dev',
            description: 'Starts Nest in watch mode',
            executionOrder: 1,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        },
      ],
    ]);
    expect(update).toHaveBeenCalledWith({
      where: { id: COMMAND_ID },
      data: {
        title: 'Start API',
        command: 'pnpm --filter api dev',
        description: 'Starts Nest in watch mode',
        executionOrder: 1,
        updatedAt: timestamp,
      },
    });
    expect(deleteCommand).toHaveBeenCalledWith({ where: { id: COMMAND_ID } });
  });

  it('retorna null quando o comando não existe', async () => {
    await expect(repository.findById(COMMAND_ID)).resolves.toBeNull();
  });

  it('aplica todos os filtros, paginação e ordenação permitida', async () => {
    count.mockResolvedValue(1);
    findMany.mockResolvedValue([makeModel()]);
    const params = new ProjectCommandSearchParams({
      page: 2,
      perPage: 5,
      sort: 'executionOrder',
      sortDir: 'asc',
      filter: {
        projectId: PROJECT_ID,
        title: 'start',
        command: 'pnpm',
        description: 'watch',
      },
    });

    const result = await repository.search(params);
    const where = {
      projectId: PROJECT_ID,
      title: { contains: 'start', mode: 'insensitive' },
      command: { contains: 'pnpm', mode: 'insensitive' },
      description: { contains: 'watch', mode: 'insensitive' },
    };
    expect(count).toHaveBeenCalledWith({ where });
    expect(findMany).toHaveBeenCalledWith({
      where,
      orderBy: { executionOrder: 'asc' },
      skip: 5,
      take: 5,
    });
    expect(result.items[0]).toBeInstanceOf(ProjectCommandEntity);
  });

  it('usa filtro vazio e ordenação padrão para sort não permitido', async () => {
    await repository.search(
      new ProjectCommandSearchParams({ sort: 'command', filter: null }),
    );

    expect(findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 15,
    });
  });
});

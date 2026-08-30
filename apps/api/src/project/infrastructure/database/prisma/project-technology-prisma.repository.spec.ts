import { ProjectTechnologyEntity } from '@/project/domain/entities/project-technology.entity';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { ProjectTechnologyPrismaRepository } from './project-technology-prisma.repository';

const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174000';
const TECHNOLOGY_ID = '123e4567-e89b-42d3-a456-426614174001';

describe('ProjectTechnologyPrismaRepository', () => {
  const create = jest.fn().mockResolvedValue(undefined);
  const findUnique = jest.fn().mockResolvedValue(null);
  const findMany = jest.fn().mockResolvedValue([]);
  const update = jest.fn().mockResolvedValue(undefined);
  const deleteTechnology = jest.fn().mockResolvedValue(undefined);
  const prismaService = {
    projectTechnology: {
      create,
      findUnique,
      findMany,
      update,
      delete: deleteTechnology,
    },
  } as unknown as PrismaService;
  const repository = new ProjectTechnologyPrismaRepository(prismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeEntity(): ProjectTechnologyEntity {
    const createdAt = new Date('2026-08-01T00:00:00.000Z');

    return new ProjectTechnologyEntity(
      {
        projectId: PROJECT_ID,
        name: 'NestJS',
        version: '11',
        createdAt,
        updatedAt: createdAt,
      },
      TECHNOLOGY_ID,
    );
  }

  function makeModel() {
    const createdAt = new Date('2026-08-01T00:00:00.000Z');

    return {
      id: TECHNOLOGY_ID,
      projectId: PROJECT_ID,
      name: 'NestJS',
      version: '11',
      createdAt,
      updatedAt: createdAt,
    };
  }

  it('insere a entidade usando o mapper de persistência', async () => {
    await repository.insert(makeEntity());

    expect(create).toHaveBeenCalledWith({ data: makeEntity().toJSON() });
  });

  it('lista todas as tecnologias convertidas em entidades', async () => {
    findMany.mockResolvedValueOnce([makeModel()]);

    const result = await repository.findAll();

    expect(findMany).toHaveBeenCalledWith();
    expect(result).toMatchObject([
      { id: TECHNOLOGY_ID, projectId: PROJECT_ID, name: 'NestJS' },
    ]);
  });

  it('busca por id e retorna null quando não encontra', async () => {
    await expect(repository.findById(TECHNOLOGY_ID)).resolves.toBeNull();

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: TECHNOLOGY_ID },
    });
  });

  it('busca pela chave composta do projeto e nome', async () => {
    await repository.findByName(PROJECT_ID, 'NestJS');

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        projectId_name: { projectId: PROJECT_ID, name: 'NestJS' },
      },
    });
  });

  it('lista as tecnologias de um projeto', async () => {
    await repository.findByProjectId(PROJECT_ID);

    expect(findMany).toHaveBeenCalledWith({
      where: { projectId: PROJECT_ID },
    });
  });

  it('atualiza nome, versão e data de atualização', async () => {
    const entity = makeEntity();

    await repository.update(entity);

    expect(update).toHaveBeenCalledWith({
      where: { id: TECHNOLOGY_ID },
      data: {
        name: 'NestJS',
        version: '11',
        updatedAt: entity.updatedAt,
      },
    });
  });

  it('remove pelo id', async () => {
    await repository.delete(TECHNOLOGY_ID);

    expect(deleteTechnology).toHaveBeenCalledWith({
      where: { id: TECHNOLOGY_ID },
    });
  });
});

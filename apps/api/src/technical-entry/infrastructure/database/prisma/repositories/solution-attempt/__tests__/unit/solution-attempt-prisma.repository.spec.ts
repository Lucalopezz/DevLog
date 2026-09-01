import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { SolutionAttemptEntity } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt.entity';
import { SolutionAttemptResult } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt-result.enum';
import { SolutionAttemptSearchParams } from '@/technical-entry/domain/repositories/solution-attempt/solution-attempt.repository';
import {
  SolutionAttempt,
  SolutionAttemptResult as PrismaSolutionAttemptResult,
} from '@generated/prisma/client';
import { SolutionAttemptPrismaRepository } from '../../solution-attempt-prisma.repository';

const ENTRY_ID = '123e4567-e89b-42d3-a456-426614174010';
const ATTEMPT_ID = '123e4567-e89b-42d3-a456-426614174020';
const timestamp = new Date('2026-08-01T00:00:00.000Z');

function makeEntity(): SolutionAttemptEntity {
  return new SolutionAttemptEntity(
    {
      technicalEntryId: ENTRY_ID,
      description: 'Adicionar credentials na requisição',
      result: SolutionAttemptResult.PARTIAL,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    ATTEMPT_ID,
  );
}

function makeModel(): SolutionAttempt {
  return {
    id: ATTEMPT_ID,
    technicalEntryId: ENTRY_ID,
    description: 'Adicionar credentials na requisição',
    result: PrismaSolutionAttemptResult.PARTIAL,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe('SolutionAttemptPrismaRepository', () => {
  const create = jest.fn();
  const count = jest.fn();
  const findMany = jest.fn();
  const findUnique = jest.fn();
  const update = jest.fn();
  const deleteAttempt = jest.fn();
  const prismaService = {
    solutionAttempt: {
      create,
      count,
      findMany,
      findUnique,
      update,
      delete: deleteAttempt,
    },
  } as unknown as PrismaService;
  const repository = new SolutionAttemptPrismaRepository(prismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    create.mockResolvedValue(undefined);
    count.mockResolvedValue(0);
    findMany.mockResolvedValue([]);
    findUnique.mockResolvedValue(null);
    update.mockResolvedValue(undefined);
    deleteAttempt.mockResolvedValue(undefined);
  });

  it('declara somente campos seguros para ordenação', () => {
    expect(repository.sortableFields).toEqual(['createdAt', 'result']);
  });

  it('executa CRUD convertendo modelos e entidades', async () => {
    const entity = makeEntity();
    findMany.mockResolvedValue([makeModel()]);
    findUnique.mockResolvedValue(makeModel());

    await repository.insert(entity);
    await expect(repository.findAll()).resolves.toEqual([
      expect.objectContaining({ id: ATTEMPT_ID }),
    ]);
    await expect(repository.findById(ATTEMPT_ID)).resolves.toMatchObject({
      id: ATTEMPT_ID,
    });
    await repository.update(entity);
    await repository.delete(ATTEMPT_ID);

    expect(create.mock.calls).toEqual([
      [
        {
          data: {
            id: ATTEMPT_ID,
            technicalEntryId: ENTRY_ID,
            description: 'Adicionar credentials na requisição',
            result: PrismaSolutionAttemptResult.PARTIAL,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        },
      ],
    ]);
    expect(update).toHaveBeenCalledWith({
      where: { id: ATTEMPT_ID },
      data: {
        description: 'Adicionar credentials na requisição',
        result: PrismaSolutionAttemptResult.PARTIAL,
        updatedAt: timestamp,
      },
    });
    expect(deleteAttempt).toHaveBeenCalledWith({ where: { id: ATTEMPT_ID } });
  });

  it('retorna null quando a tentativa não existe', async () => {
    await expect(repository.findById(ATTEMPT_ID)).resolves.toBeNull();
  });

  it('lista somente as tentativas da entrada informada', async () => {
    findMany.mockResolvedValue([makeModel()]);

    await expect(repository.findByTechnicalEntryId(ENTRY_ID)).resolves.toEqual([
      expect.objectContaining({ technicalEntryId: ENTRY_ID }),
    ]);
    expect(findMany).toHaveBeenCalledWith({
      where: { technicalEntryId: ENTRY_ID },
    });
  });

  it('aplica filtros, paginação e ordenação permitida', async () => {
    count.mockResolvedValue(1);
    findMany.mockResolvedValue([makeModel()]);
    const params = new SolutionAttemptSearchParams({
      page: 2,
      perPage: 5,
      sort: 'result',
      sortDir: 'asc',
      filter: {
        technicalEntryId: ENTRY_ID,
        result: SolutionAttemptResult.PARTIAL,
      },
    });

    const result = await repository.search(params);
    const where = {
      technicalEntryId: ENTRY_ID,
      result: PrismaSolutionAttemptResult.PARTIAL,
    };
    expect(count).toHaveBeenCalledWith({ where });
    expect(findMany).toHaveBeenCalledWith({
      where,
      orderBy: { result: 'asc' },
      skip: 5,
      take: 5,
    });
    expect(result.items[0]).toBeInstanceOf(SolutionAttemptEntity);
  });

  it('usa filtro vazio e ordenação padrão para sort não permitido', async () => {
    await repository.search(
      new SolutionAttemptSearchParams({ sort: 'description', filter: null }),
    );

    expect(findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 15,
    });
  });
});

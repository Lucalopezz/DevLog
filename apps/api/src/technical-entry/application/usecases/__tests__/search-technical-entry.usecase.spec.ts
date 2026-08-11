import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import { TechnicalEntryStatus } from '@/technical-entry/domain/entities/technical-entry-status.enum';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry.entity';
import {
  TechnicalEntryRepository,
  TechnicalEntrySearchParams,
  TechnicalEntrySearchResult,
} from '@/technical-entry/domain/repositories/technical-entry.repository';
import { SearchTechnicalEntryUseCase } from '../search-technical-entry.usecase';
import { UnprocessableEntityException } from '@nestjs/common';

describe('SearchTechnicalEntryUseCase', () => {
  let repository: jest.Mocked<TechnicalEntryRepository>;
  let useCase: SearchTechnicalEntryUseCase;

  beforeEach(() => {
    repository = {
      search: jest.fn(),
    } as unknown as jest.Mocked<TechnicalEntryRepository>;
    useCase = new SearchTechnicalEntryUseCase(repository);
  });

  it('converte a entrada em parâmetros de busca', async () => {
    repository.search.mockResolvedValue(
      new TechnicalEntrySearchResult({
        items: [],
        total: 0,
        currentPage: 2,
        perPage: 10,
      }),
    );

    await useCase.execute({
      page: 2,
      perPage: 10,
      sort: 'title',
      sortDir: 'desc',
      userId: 'user-1',
      projectId: 'project-1',
      title: 'NestJS',
      type: TechnicalEntryType.ISSUE,
      status: TechnicalEntryStatus.RESOLVED,
      archivedAt: null,
    });

    const params = repository.search.mock.calls[0][0];

    expect(params).toBeInstanceOf(TechnicalEntrySearchParams);
    expect(params).toMatchObject({
      page: 2,
      perPage: 10,
      sort: 'title',
      sortDir: 'desc',
      filter: {
        userId: 'user-1',
        projectId: 'project-1',
        title: 'NestJS',
        type: TechnicalEntryType.ISSUE,
        status: TechnicalEntryStatus.RESOLVED,
        archivedAt: null,
      },
    });
  });

  it('rejeita filtro de status para entradas do tipo LEARNING', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        type: TechnicalEntryType.LEARNING,
        status: TechnicalEntryStatus.OPEN,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(repository.search.mock.calls).toHaveLength(0);
  });

  it('converte o resultado do repositório em uma saída paginada', async () => {
    const entry = new TechnicalEntryEntity(
      {
        userId: 'user-1',
        title: 'Paginação no NestJS',
        context: 'Implementando uma busca paginada',
        type: TechnicalEntryType.ISSUE,
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        updatedAt: new Date('2026-08-01T00:00:00.000Z'),
      },
      'entry-1',
    );

    repository.search.mockResolvedValue(
      new TechnicalEntrySearchResult({
        items: [entry],
        total: 3,
        currentPage: 2,
        perPage: 1,
      }),
    );

    const output = await useCase.execute({
      userId: 'user-1',
      page: 2,
      perPage: 1,
    });

    expect(output).toEqual({
      items: [
        expect.objectContaining({
          id: 'entry-1',
          title: 'Paginação no NestJS',
          status: 'OPEN',
        }),
      ],
      total: 3,
      currentPage: 2,
      lastPage: 3,
      perPage: 1,
    });
  });
});

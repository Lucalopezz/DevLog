import { NotFoundException } from '@nestjs/common';
import { SolutionAttemptResult } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt-result.enum';
import { SolutionAttemptEntity } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt.entity';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry.entity';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import {
  SolutionAttemptRepository,
  SolutionAttemptSearchResult,
} from '@/technical-entry/domain/repositories/solution-attempt/solution-attempt.repositoty';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry.repository';
import { ListSolutionAttemptsUseCase } from '../list-solution-attempts.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const ENTRY_ID = '123e4567-e89b-42d3-a456-426614174010';

function makeEntry(userId = USER_ID) {
  return new TechnicalEntryEntity(
    {
      userId,
      title: 'Erro na API',
      context: 'Investigando o erro da API',
      type: TechnicalEntryType.ISSUE,
    },
    ENTRY_ID,
  );
}

function makeAttempt() {
  return new SolutionAttemptEntity(
    {
      technicalEntryId: ENTRY_ID,
      description: 'Adicionar credentials na requisição',
      result: SolutionAttemptResult.SUCCESSFUL,
    },
    '123e4567-e89b-42d3-a456-426614174011',
  );
}

describe('ListSolutionAttemptsUseCase', () => {
  let solutionAttemptRepository: jest.Mocked<SolutionAttemptRepository>;
  let technicalEntryRepository: jest.Mocked<TechnicalEntryRepository>;

  beforeEach(() => {
    solutionAttemptRepository = {
      search: jest.fn(),
    } as unknown as jest.Mocked<SolutionAttemptRepository>;
    technicalEntryRepository = {
      findById: jest.fn().mockResolvedValue(makeEntry()),
    } as unknown as jest.Mocked<TechnicalEntryRepository>;
  });

  it('valida a entrada e lista suas tentativas com paginação', async () => {
    solutionAttemptRepository.search.mockResolvedValue(
      new SolutionAttemptSearchResult({
        items: [makeAttempt()],
        total: 1,
        currentPage: 1,
        perPage: 15,
      }),
    );
    const useCase = new ListSolutionAttemptsUseCase(
      solutionAttemptRepository,
      technicalEntryRepository,
    );

    const output = await useCase.execute({
      userId: USER_ID,
      technicalEntryId: ENTRY_ID,
      result: SolutionAttemptResult.SUCCESSFUL,
    });

    expect(technicalEntryRepository.findById.mock.calls).toEqual([[ENTRY_ID]]);
    expect(solutionAttemptRepository.search.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        filter: {
          technicalEntryId: ENTRY_ID,
          result: SolutionAttemptResult.SUCCESSFUL,
        },
      }),
    );
    expect(output).toMatchObject({
      items: [
        expect.objectContaining({
          technicalEntryId: ENTRY_ID,
          result: SolutionAttemptResult.SUCCESSFUL,
        }),
      ],
      total: 1,
      currentPage: 1,
      lastPage: 1,
      perPage: 15,
    });
  });

  it('não lista tentativas de uma entrada de outro usuário', async () => {
    technicalEntryRepository.findById.mockResolvedValue(
      makeEntry(OTHER_USER_ID),
    );
    const useCase = new ListSolutionAttemptsUseCase(
      solutionAttemptRepository,
      technicalEntryRepository,
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        technicalEntryId: ENTRY_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(solutionAttemptRepository.search.mock.calls).toHaveLength(0);
  });
});

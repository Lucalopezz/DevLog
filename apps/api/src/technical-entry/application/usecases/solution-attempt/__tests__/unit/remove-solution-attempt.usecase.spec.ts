import { NotFoundException } from '@nestjs/common';
import { SolutionAttemptResult } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt-result.enum';
import { SolutionAttemptEntity } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt.entity';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry/technical-entry.entity';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry/technical-entry-type.enum';
import { SolutionAttemptRepository } from '@/technical-entry/domain/repositories/solution-attempt/solution-attempt.repository';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';
import { RemoveSolutionAttemptUseCase } from '../../remove-solution-attempt.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const ENTRY_ID = '123e4567-e89b-42d3-a456-426614174010';
const OTHER_ENTRY_ID = '123e4567-e89b-42d3-a456-426614174011';
const ATTEMPT_ID = '123e4567-e89b-42d3-a456-426614174020';

function makeEntry(id = ENTRY_ID, userId = USER_ID) {
  return new TechnicalEntryEntity(
    {
      userId,
      title: 'Erro na API',
      context: 'Investigando o erro da API',
      type: TechnicalEntryType.ISSUE,
    },
    id,
  );
}

function makeAttempt(technicalEntryId = ENTRY_ID) {
  return new SolutionAttemptEntity(
    {
      technicalEntryId,
      description: 'Adicionar credentials na requisição',
      result: SolutionAttemptResult.PARTIAL,
    },
    ATTEMPT_ID,
  );
}

describe('RemoveSolutionAttemptUseCase', () => {
  let solutionAttemptRepository: jest.Mocked<SolutionAttemptRepository>;
  let technicalEntryRepository: jest.Mocked<TechnicalEntryRepository>;

  beforeEach(() => {
    solutionAttemptRepository = {
      findById: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<SolutionAttemptRepository>;
    technicalEntryRepository = {
      findById: jest.fn().mockResolvedValue(makeEntry()),
    } as unknown as jest.Mocked<TechnicalEntryRepository>;
  });

  it('remove uma tentativa da entrada do usuário autenticado', async () => {
    solutionAttemptRepository.findById.mockResolvedValue(makeAttempt());
    const useCase = new RemoveSolutionAttemptUseCase(
      technicalEntryRepository,
      solutionAttemptRepository,
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        technicalEntryId: ENTRY_ID,
        attemptId: ATTEMPT_ID,
      }),
    ).resolves.toBeUndefined();

    expect(solutionAttemptRepository.delete.mock.calls).toEqual([[ATTEMPT_ID]]);
  });

  it('não remove uma tentativa inexistente', async () => {
    solutionAttemptRepository.findById.mockResolvedValue(null);
    const useCase = new RemoveSolutionAttemptUseCase(
      technicalEntryRepository,
      solutionAttemptRepository,
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        technicalEntryId: ENTRY_ID,
        attemptId: ATTEMPT_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(solutionAttemptRepository.delete.mock.calls).toHaveLength(0);
  });

  it('não remove uma tentativa de outro usuário ou de outra entrada', async () => {
    technicalEntryRepository.findById.mockResolvedValue(
      makeEntry(ENTRY_ID, OTHER_USER_ID),
    );
    solutionAttemptRepository.findById.mockResolvedValue(makeAttempt());
    const useCase = new RemoveSolutionAttemptUseCase(
      technicalEntryRepository,
      solutionAttemptRepository,
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        technicalEntryId: ENTRY_ID,
        attemptId: ATTEMPT_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(solutionAttemptRepository.findById.mock.calls).toHaveLength(0);
    expect(solutionAttemptRepository.delete.mock.calls).toHaveLength(0);

    technicalEntryRepository.findById.mockResolvedValue(makeEntry());
    solutionAttemptRepository.findById.mockResolvedValue(
      makeAttempt(OTHER_ENTRY_ID),
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        technicalEntryId: ENTRY_ID,
        attemptId: ATTEMPT_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(solutionAttemptRepository.delete.mock.calls).toHaveLength(0);
  });
});

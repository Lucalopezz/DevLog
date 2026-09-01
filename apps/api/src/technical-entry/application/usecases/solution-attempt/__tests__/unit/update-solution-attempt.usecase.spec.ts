import { NotFoundException } from '@nestjs/common';
import { SolutionAttemptResult } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt-result.enum';
import { SolutionAttemptEntity } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt.entity';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry/technical-entry.entity';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry/technical-entry-type.enum';
import { SolutionAttemptRepository } from '@/technical-entry/domain/repositories/solution-attempt/solution-attempt.repository';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';
import { UpdateSolutionAttemptUseCase } from '../../update-solution-attempt.usecase';

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

describe('UpdateSolutionAttemptUseCase', () => {
  let solutionAttemptRepository: jest.Mocked<SolutionAttemptRepository>;
  let technicalEntryRepository: jest.Mocked<TechnicalEntryRepository>;

  beforeEach(() => {
    solutionAttemptRepository = {
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<SolutionAttemptRepository>;
    technicalEntryRepository = {
      findById: jest.fn().mockResolvedValue(makeEntry()),
    } as unknown as jest.Mocked<TechnicalEntryRepository>;
  });

  it('atualiza somente a descrição e preserva o resultado', async () => {
    const attempt = makeAttempt();
    solutionAttemptRepository.findById.mockResolvedValue(attempt);
    const useCase = new UpdateSolutionAttemptUseCase(
      technicalEntryRepository,
      solutionAttemptRepository,
    );

    const output = await useCase.execute({
      attemptId: ATTEMPT_ID,
      userId: USER_ID,
      technicalEntryId: ENTRY_ID,
      description: 'Corrigir o cabeçalho da requisição',
    });

    expect(output).toMatchObject({
      id: ATTEMPT_ID,
      technicalEntryId: ENTRY_ID,
      description: 'Corrigir o cabeçalho da requisição',
      result: SolutionAttemptResult.PARTIAL,
    });
    expect(solutionAttemptRepository.update.mock.calls).toEqual([[attempt]]);
  });

  it('não atualiza uma entrada de outro usuário', async () => {
    technicalEntryRepository.findById.mockResolvedValue(
      makeEntry(ENTRY_ID, OTHER_USER_ID),
    );
    const useCase = new UpdateSolutionAttemptUseCase(
      technicalEntryRepository,
      solutionAttemptRepository,
    );

    await expect(
      useCase.execute({
        attemptId: ATTEMPT_ID,
        userId: USER_ID,
        technicalEntryId: ENTRY_ID,
        description: 'Tentativa indevida',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(solutionAttemptRepository.findById.mock.calls).toHaveLength(0);
    expect(solutionAttemptRepository.update.mock.calls).toHaveLength(0);
  });

  it('não atualiza uma tentativa vinculada a outra entrada', async () => {
    const attempt = makeAttempt(OTHER_ENTRY_ID);
    solutionAttemptRepository.findById.mockResolvedValue(attempt);
    const useCase = new UpdateSolutionAttemptUseCase(
      technicalEntryRepository,
      solutionAttemptRepository,
    );

    await expect(
      useCase.execute({
        attemptId: ATTEMPT_ID,
        userId: USER_ID,
        technicalEntryId: ENTRY_ID,
        description: 'Tentativa indevida',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(solutionAttemptRepository.update.mock.calls).toHaveLength(0);
  });
});

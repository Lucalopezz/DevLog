import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry/technical-entry.entity';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry/technical-entry-type.enum';
import { SolutionAttemptResult } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt-result.enum';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';
import { SolutionAttemptRepository } from '@/technical-entry/domain/repositories/solution-attempt/solution-attempt.repository';
import { AddSolutionAttemptUseCase } from '../../add-solution-attempt.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const ENTRY_ID = '123e4567-e89b-42d3-a456-426614174010';

function makeEntry(
  overrides: Partial<{
    userId: string;
    type: TechnicalEntryType;
    archivedAt: Date;
  }> = {},
): TechnicalEntryEntity {
  return new TechnicalEntryEntity(
    {
      userId: overrides.userId ?? USER_ID,
      title: 'Erro na API',
      context: 'Contexto do erro',
      type: overrides.type ?? TechnicalEntryType.ISSUE,
      archivedAt: overrides.archivedAt,
    },
    ENTRY_ID,
  );
}

function makeUseCase(entry: TechnicalEntryEntity | null = makeEntry()) {
  const technicalEntryRepository = {
    findById: jest.fn().mockResolvedValue(entry),
  } as unknown as jest.Mocked<TechnicalEntryRepository>;
  const solutionAttemptRepository = {
    insert: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SolutionAttemptRepository>;

  return {
    useCase: new AddSolutionAttemptUseCase(
      technicalEntryRepository,
      solutionAttemptRepository,
    ),
    solutionAttemptRepository,
  };
}

describe('AddSolutionAttemptUseCase', () => {
  it('cria e persiste uma tentativa para uma entrada ISSUE aberta', async () => {
    const { useCase, solutionAttemptRepository } = makeUseCase();

    const output = await useCase.execute({
      userId: USER_ID,
      technicalEntryId: ENTRY_ID,
      description: 'Adicionar credentials na requisição',
      result: SolutionAttemptResult.PARTIAL,
    });

    const inserted = solutionAttemptRepository.insert.mock.calls[0]?.[0];
    expect(inserted).toMatchObject({
      technicalEntryId: ENTRY_ID,
      description: 'Adicionar credentials na requisição',
      result: SolutionAttemptResult.PARTIAL,
    });
    expect(output).toMatchObject({
      id: inserted.id,
      technicalEntryId: ENTRY_ID,
      result: SolutionAttemptResult.PARTIAL,
    });
  });

  it.each([
    ['entrada inexistente', null],
    ['entrada de outro usuário', makeEntry({ userId: OTHER_USER_ID })],
  ])('rejeita %s sem persistir tentativa', async (_case, entry) => {
    const { useCase, solutionAttemptRepository } = makeUseCase(entry);

    await expect(
      useCase.execute({
        userId: USER_ID,
        technicalEntryId: ENTRY_ID,
        description: 'Tentativa',
        result: SolutionAttemptResult.FAILED,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(solutionAttemptRepository.insert.mock.calls).toHaveLength(0);
  });

  it.each([
    ['entrada LEARNING', makeEntry({ type: TechnicalEntryType.LEARNING })],
    ['entrada arquivada', makeEntry({ archivedAt: new Date() })],
  ])('rejeita %s sem persistir tentativa', async (_case, entry) => {
    const { useCase, solutionAttemptRepository } = makeUseCase(entry);

    await expect(
      useCase.execute({
        userId: USER_ID,
        technicalEntryId: ENTRY_ID,
        description: 'Tentativa',
        result: SolutionAttemptResult.FAILED,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(solutionAttemptRepository.insert.mock.calls).toHaveLength(0);
  });
});

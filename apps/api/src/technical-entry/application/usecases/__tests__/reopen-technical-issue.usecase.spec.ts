import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry.entity';
import { TechnicalEntryStatus } from '@/technical-entry/domain/entities/technical-entry-status.enum';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry.repository';
import { ReopenTechnicalIssueUseCase } from '../reopen-technical-issue.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const ENTRY_ID = '123e4567-e89b-42d3-a456-426614174010';

function makeEntry(
  overrides: Partial<{
    userId: string;
    type: TechnicalEntryType;
    conclusion: string;
    resolvedAt: Date;
    open: boolean;
  }> = {},
) {
  const timestamp = new Date('2026-08-01T00:00:00.000Z');

  return new TechnicalEntryEntity(
    {
      userId: overrides.userId ?? USER_ID,
      title: 'Erro na API',
      context: 'Investigando o erro da API',
      type: overrides.type ?? TechnicalEntryType.ISSUE,
      conclusion: overrides.conclusion ?? 'A configuração foi corrigida',
      resolvedAt: overrides.open
        ? undefined
        : (overrides.resolvedAt ?? new Date('2026-08-02T12:00:00.000Z')),
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    ENTRY_ID,
  );
}

function makeRepository(entry: TechnicalEntryEntity | null = makeEntry()) {
  return {
    repository: {
      findById: jest.fn().mockResolvedValue(entry),
      update: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<TechnicalEntryRepository>,
  };
}

describe('ReopenTechnicalIssueUseCase', () => {
  it('reabre uma ISSUE resolvida e preserva a conclusão', async () => {
    const entry = makeEntry();
    const { repository } = makeRepository(entry);
    const useCase = new ReopenTechnicalIssueUseCase(repository);

    const output = await useCase.execute({
      id: ENTRY_ID,
      userId: USER_ID,
    });

    expect(repository.update.mock.calls).toEqual([[entry]]);
    expect(output).toMatchObject({
      id: ENTRY_ID,
      conclusion: 'A configuração foi corrigida',
      status: TechnicalEntryStatus.OPEN,
    });
    expect(output.resolvedAt).toBeUndefined();
  });

  it('rejeita uma ISSUE que ainda está aberta', async () => {
    const entry = makeEntry({ open: true });
    const { repository } = makeRepository(entry);
    const useCase = new ReopenTechnicalIssueUseCase(repository);

    await expect(
      useCase.execute({ id: ENTRY_ID, userId: USER_ID }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(repository.update.mock.calls).toHaveLength(0);
  });

  it('rejeita entradas LEARNING', async () => {
    const entry = makeEntry({ type: TechnicalEntryType.LEARNING, open: true });
    const { repository } = makeRepository(entry);
    const useCase = new ReopenTechnicalIssueUseCase(repository);

    await expect(
      useCase.execute({ id: ENTRY_ID, userId: USER_ID }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(repository.update.mock.calls).toHaveLength(0);
  });

  it('não reabre uma entrada de outro usuário', async () => {
    const entry = makeEntry({ userId: OTHER_USER_ID });
    const { repository } = makeRepository(entry);
    const useCase = new ReopenTechnicalIssueUseCase(repository);

    await expect(
      useCase.execute({ id: ENTRY_ID, userId: USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.update.mock.calls).toHaveLength(0);
    expect(entry.status).toBe(TechnicalEntryStatus.RESOLVED);
  });

  it('mantém a invariável de reabertura no domínio', () => {
    const entry = makeEntry();

    entry.reopen();

    expect(entry.status).toBe(TechnicalEntryStatus.OPEN);
    expect(entry.conclusion).toBe('A configuração foi corrigida');
    expect(entry.resolvedAt).toBeUndefined();

    expect(() => entry.reopen()).toThrow(EntityValidationError);
  });
});

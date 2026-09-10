import { NotFoundException } from '@nestjs/common';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry/technical-entry.entity';
import { TechnicalEntryStatus } from '@/technical-entry/domain/entities/technical-entry/technical-entry-status.enum';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry/technical-entry-type.enum';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';
import { ReopenTechnicalIssueUseCase } from '../../reopen-technical-issue.usecase';

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
      title: 'API error',
      context: 'Investigating the API error',
      type: overrides.type ?? TechnicalEntryType.ISSUE,
      conclusion: overrides.conclusion ?? 'The configuration was fixed',
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
  it('reopens a resolved ISSUE and preserves the conclusion', async () => {
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
      conclusion: 'The configuration was fixed',
      status: TechnicalEntryStatus.OPEN,
    });
    expect(output.resolvedAt).toBeUndefined();
  });

  it('rejects an ISSUE that is still open', async () => {
    const entry = makeEntry({ open: true });
    const { repository } = makeRepository(entry);
    const useCase = new ReopenTechnicalIssueUseCase(repository);

    await expect(
      useCase.execute({ id: ENTRY_ID, userId: USER_ID }),
    ).rejects.toMatchObject({
      error: {
        resolvedAt: ['Only resolved entries can be reopened'],
      },
    });

    expect(repository.update.mock.calls).toHaveLength(0);
  });

  it('rejects LEARNING entries', async () => {
    const entry = makeEntry({ type: TechnicalEntryType.LEARNING, open: true });
    const { repository } = makeRepository(entry);
    const useCase = new ReopenTechnicalIssueUseCase(repository);

    await expect(
      useCase.execute({ id: ENTRY_ID, userId: USER_ID }),
    ).rejects.toMatchObject({
      error: {
        type: ['Only ISSUE entries can be reopened'],
      },
    });

    expect(repository.update.mock.calls).toHaveLength(0);
  });

  it("does not reopen another user's entry", async () => {
    const entry = makeEntry({ userId: OTHER_USER_ID });
    const { repository } = makeRepository(entry);
    const useCase = new ReopenTechnicalIssueUseCase(repository);

    await expect(
      useCase.execute({ id: ENTRY_ID, userId: USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.update.mock.calls).toHaveLength(0);
    expect(entry.status).toBe(TechnicalEntryStatus.RESOLVED);
  });

  it('keeps the reopening invariant in the domain', () => {
    const entry = makeEntry();

    entry.reopen();

    expect(entry.status).toBe(TechnicalEntryStatus.OPEN);
    expect(entry.conclusion).toBe('The configuration was fixed');
    expect(entry.resolvedAt).toBeUndefined();

    expect(() => entry.reopen()).toThrow(EntityValidationError);
  });
});

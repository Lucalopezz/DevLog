import { NotFoundException } from '@nestjs/common';
import { RestoreTechnicalEntryUseCase } from '../../restore-technical-entry.usecase';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry/technical-entry.entity';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry/technical-entry-type.enum';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const ENTRY_ID = '123e4567-e89b-42d3-a456-426614174010';

function makeEntry(userId = USER_ID, archivedAt?: Date): TechnicalEntryEntity {
  return new TechnicalEntryEntity(
    {
      userId,
      title: 'Failed to start the API',
      context: 'The port was occupied',
      type: TechnicalEntryType.ISSUE,
      archivedAt,
    },
    ENTRY_ID,
  );
}

function makeRepository(entry: TechnicalEntryEntity | null) {
  return {
    findById: jest.fn().mockResolvedValue(entry),
    update: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<TechnicalEntryRepository>;
}

describe('RestoreTechnicalEntryUseCase', () => {
  afterEach(() => jest.useRealTimers());

  it('restores the user entry idempotently', async () => {
    jest.useFakeTimers();
    const archivedAt = new Date('2026-08-02T12:00:00.000Z');
    const restoredAt = new Date('2026-08-03T12:00:00.000Z');
    jest.setSystemTime(restoredAt);
    const entry = makeEntry(USER_ID, archivedAt);
    const repository = makeRepository(entry);
    const useCase = new RestoreTechnicalEntryUseCase(repository);

    const first = await useCase.execute({ id: ENTRY_ID, userId: USER_ID });
    jest.setSystemTime(new Date('2026-08-04T12:00:00.000Z'));
    const second = await useCase.execute({ id: ENTRY_ID, userId: USER_ID });

    expect(first.archivedAt).toBeUndefined();
    expect(first.updatedAt).toEqual(restoredAt);
    expect(second.archivedAt).toBeUndefined();
    expect(second.updatedAt).toEqual(restoredAt);
    expect(repository.update.mock.calls).toHaveLength(2);
  });

  it.each([
    ['missing', null],
    ['belonging to another user', makeEntry(OTHER_USER_ID, new Date())],
  ])('does not restore an entry %s', async (_description, entry) => {
    const repository = makeRepository(entry);
    const useCase = new RestoreTechnicalEntryUseCase(repository);

    await expect(
      useCase.execute({ id: ENTRY_ID, userId: USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update.mock.calls).toHaveLength(0);
  });
});

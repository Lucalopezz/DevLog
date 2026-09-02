import { NotFoundException } from '@nestjs/common';
import { ArchiveTechnicalEntryUseCase } from '../../archive-technical-entry.usecase';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry/technical-entry.entity';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry/technical-entry-type.enum';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const ENTRY_ID = '123e4567-e89b-42d3-a456-426614174010';

function makeEntry(userId = USER_ID): TechnicalEntryEntity {
  return new TechnicalEntryEntity(
    {
      userId,
      title: 'Falha ao iniciar a API',
      context: 'A porta estava ocupada',
      type: TechnicalEntryType.ISSUE,
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

describe('ArchiveTechnicalEntryUseCase', () => {
  afterEach(() => jest.useRealTimers());

  it('arquiva a entrada do usuário de forma idempotente', async () => {
    jest.useFakeTimers();
    const archivedAt = new Date('2026-08-02T12:00:00.000Z');
    jest.setSystemTime(archivedAt);
    const entry = makeEntry();
    const repository = makeRepository(entry);
    const useCase = new ArchiveTechnicalEntryUseCase(repository);

    const first = await useCase.execute({ id: ENTRY_ID, userId: USER_ID });
    jest.setSystemTime(new Date('2026-08-03T12:00:00.000Z'));
    const second = await useCase.execute({ id: ENTRY_ID, userId: USER_ID });

    expect(first.archivedAt).toEqual(archivedAt);
    expect(second.archivedAt).toEqual(archivedAt);
    expect(repository.update.mock.calls).toHaveLength(2);
  });

  it.each([
    ['inexistente', null],
    ['de outro usuário', makeEntry(OTHER_USER_ID)],
  ])('não arquiva uma entrada %s', async (_description, entry) => {
    const repository = makeRepository(entry);
    const useCase = new ArchiveTechnicalEntryUseCase(repository);

    await expect(
      useCase.execute({ id: ENTRY_ID, userId: USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update.mock.calls).toHaveLength(0);
  });
});

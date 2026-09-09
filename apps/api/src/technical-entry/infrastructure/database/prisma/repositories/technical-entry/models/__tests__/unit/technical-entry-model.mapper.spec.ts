import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry/technical-entry-type.enum';
import { TechnicalEntryType as PrismaTechnicalEntryType } from '@generated/prisma/client';
import { TechnicalEntryModelMapper } from '../../technical-entry-model.mapper';

describe('TechnicalEntryModelMapper', () => {
  it('converts the domain type to the Prisma type', () => {
    expect(
      TechnicalEntryModelMapper.toPrismaType(TechnicalEntryType.ISSUE),
    ).toBe(PrismaTechnicalEntryType.ISSUE);
    expect(
      TechnicalEntryModelMapper.toPrismaType(TechnicalEntryType.LEARNING),
    ).toBe(PrismaTechnicalEntryType.LEARNING);
  });

  it('converts the Prisma type to the domain type', () => {
    const model = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-42d3-a456-426614174001',
      projectId: null,
      title: 'Valid title',
      context: 'Valid context',
      conclusion: null,
      type: PrismaTechnicalEntryType.LEARNING,
      resolvedAt: null,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(TechnicalEntryModelMapper.toEntity(model).type).toBe(
      TechnicalEntryType.LEARNING,
    );
  });
});

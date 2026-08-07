import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import { TechnicalEntryType as PrismaTechnicalEntryType } from '@generated/prisma/client';
import { TechnicalEntryModelMapper } from '../technical-entry-model.mapper';

describe('TechnicalEntryModelMapper', () => {
  it('converte o tipo de domínio para o tipo do Prisma', () => {
    expect(
      TechnicalEntryModelMapper.toPrismaType(TechnicalEntryType.ISSUE),
    ).toBe(PrismaTechnicalEntryType.ISSUE);
    expect(
      TechnicalEntryModelMapper.toPrismaType(TechnicalEntryType.LEARNING),
    ).toBe(PrismaTechnicalEntryType.LEARNING);
  });

  it('converte o tipo do Prisma para o tipo de domínio', () => {
    const model = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      projectId: null,
      title: 'Título válido',
      context: 'Contexto válido',
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

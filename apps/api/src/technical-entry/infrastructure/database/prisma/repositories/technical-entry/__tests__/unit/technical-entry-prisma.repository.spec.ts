import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { TechnicalEntryStatus } from '@/technical-entry/domain/entities/technical-entry/technical-entry-status.enum';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry/technical-entry-type.enum';
import { TechnicalEntrySearchParams } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';
import { TechnicalEntryType as PrismaTechnicalEntryType } from '@generated/prisma/client';
import { TechnicalEntryPrismaRepository } from '../../technical-entry-prisma.repository';

describe('TechnicalEntryPrismaRepository', () => {
  const count = jest.fn().mockResolvedValue(0);
  const findMany = jest.fn().mockResolvedValue([]);
  const prismaService = {
    technicalEntry: {
      count,
      findMany,
    },
  } as unknown as PrismaService;
  const repository = new TechnicalEntryPrismaRepository(prismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [TechnicalEntryStatus.OPEN, null],
    [TechnicalEntryStatus.RESOLVED, { not: null }],
  ])(
    'traduz o status %s para o filtro resolvedAt',
    async (status, resolvedAt) => {
      await repository.search(
        new TechnicalEntrySearchParams({
          filter: {
            userId: 'user-1',
            status,
          },
        }),
      );

      const expectedWhere = {
        userId: 'user-1',
        AND: [
          {
            type: PrismaTechnicalEntryType.ISSUE,
            resolvedAt,
          },
        ],
      };

      expect(count).toHaveBeenCalledWith({ where: expectedWhere });
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere }),
      );
    },
  );

  it('preserva a interseção quando type e status são incompatíveis', async () => {
    await repository.search(
      new TechnicalEntrySearchParams({
        filter: {
          type: TechnicalEntryType.LEARNING,
          status: TechnicalEntryStatus.OPEN,
        },
      }),
    );

    expect(count).toHaveBeenCalledWith({
      where: {
        type: PrismaTechnicalEntryType.LEARNING,
        AND: [
          {
            type: PrismaTechnicalEntryType.ISSUE,
            resolvedAt: null,
          },
        ],
      },
    });
  });
});

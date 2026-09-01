import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { TagSearchParams } from '@/tag/domain/repositories/tag.repository';
import { TagPrismaRepository } from '../../tag-prisma.repository';

describe('TagPrismaRepository', () => {
  const count = jest.fn().mockResolvedValue(0);
  const findMany = jest.fn().mockResolvedValue([]);
  const prismaService = {
    tag: {
      count,
      findMany,
    },
  } as unknown as PrismaService;
  const repository = new TagPrismaRepository(prismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aplica os filtros, a paginação e a ordenação', async () => {
    await repository.search(
      new TagSearchParams({
        page: 2,
        perPage: 10,
        sort: 'name',
        sortDir: 'asc',
        filter: {
          userId: 'user-1',
          name: 'nest',
        },
      }),
    );

    const where = {
      userId: 'user-1',
      name: { contains: 'nest', mode: 'insensitive' },
    };

    expect(count).toHaveBeenCalledWith({ where });
    expect(findMany).toHaveBeenCalledWith({
      where,
      orderBy: { name: 'asc' },
      skip: 10,
      take: 10,
    });
  });

  it('usa createdAt desc quando o campo de ordenação não é permitido', async () => {
    await repository.search(
      new TagSearchParams({
        sort: 'userId',
        sortDir: 'asc',
        filter: { userId: 'user-1' },
      }),
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    );
  });
});

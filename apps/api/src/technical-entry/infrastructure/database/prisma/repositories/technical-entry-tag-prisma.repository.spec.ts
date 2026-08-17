import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { TechnicalEntryTagPrismaRepository } from './technical-entry-tag-prisma.repository';

describe('TechnicalEntryTagPrismaRepository', () => {
  const create = jest.fn().mockResolvedValue(undefined);
  const findUnique = jest.fn().mockResolvedValue(null);
  const findMany = jest.fn().mockResolvedValue([]);
  const deleteAssociation = jest.fn().mockResolvedValue(undefined);
  const prismaService = {
    technicalEntryTag: {
      create,
      findUnique,
      findMany,
      delete: deleteAssociation,
    },
  } as unknown as PrismaService;
  const repository = new TechnicalEntryTagPrismaRepository(prismaService);
  const input = {
    technicalEntryId: 'entry-1',
    tagId: 'tag-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adiciona a associação usando os ids da entrada e da tag', async () => {
    await repository.add(input);

    expect(create).toHaveBeenCalledWith({ data: input });
  });

  it('verifica a associação pela chave composta', async () => {
    findUnique.mockResolvedValueOnce({
      technicalEntryId: input.technicalEntryId,
      tagId: input.tagId,
    });

    await expect(repository.exists(input)).resolves.toBe(true);
    expect(findUnique).toHaveBeenCalledWith({
      where: { technicalEntryId_tagId: input },
    });
  });

  it('remove a associação pela chave composta', async () => {
    await repository.remove(input);

    expect(deleteAssociation).toHaveBeenCalledWith({
      where: { technicalEntryId_tagId: input },
    });
  });

  it('busca as tags das entradas do usuário agrupadas por entrada', async () => {
    const createdAt = new Date('2026-08-10T12:00:00.000Z');
    const tag = {
      id: input.tagId,
      userId: 'user-1',
      name: 'NestJS',
      normalizedName: 'nestjs',
      createdAt,
      updatedAt: createdAt,
    };
    findMany.mockResolvedValueOnce([
      { technicalEntryId: input.technicalEntryId, tag },
    ]);

    const result = await repository.findTags({
      technicalEntryIds: [input.technicalEntryId],
      userId: 'user-1',
    });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        technicalEntryId: { in: [input.technicalEntryId] },
        tag: { userId: 'user-1' },
      },
      include: { tag: true },
    });
    expect(result.get(input.technicalEntryId)).toMatchObject([
      { id: input.tagId, name: 'NestJS', userId: 'user-1' },
    ]);
  });
});

import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { TechnicalEntryTagPrismaRepository } from './technical-entry-tag-prisma.repository';

describe('TechnicalEntryTagPrismaRepository', () => {
  const create = jest.fn().mockResolvedValue(undefined);
  const findUnique = jest.fn().mockResolvedValue(null);
  const deleteAssociation = jest.fn().mockResolvedValue(undefined);
  const prismaService = {
    technicalEntryTag: {
      create,
      findUnique,
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
});

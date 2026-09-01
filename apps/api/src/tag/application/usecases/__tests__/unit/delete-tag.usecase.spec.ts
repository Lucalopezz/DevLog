import { NotFoundException } from '@nestjs/common';
import { TagEntity } from '@/tag/domain/entities/tag.entity';
import { TagRepository } from '@/tag/domain/repositories/tag.repository';
import { DeleteTagUseCase } from '../../delete-tag.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';

function makeTag(userId = USER_ID) {
  const timestamp = new Date('2026-08-01T00:00:00.000Z');

  return new TagEntity(
    {
      userId,
      name: 'NestJS',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    'tag-1',
  );
}

describe('DeleteTagUseCase', () => {
  let repository: jest.Mocked<TagRepository>;
  let useCase: DeleteTagUseCase;
  let deleteTag: jest.Mock;

  beforeEach(() => {
    deleteTag = jest.fn();
    repository = {
      findById: jest.fn(),
      delete: deleteTag,
    } as unknown as jest.Mocked<TagRepository>;
    useCase = new DeleteTagUseCase(repository);
  });

  it('remove uma tag do usuário autenticado', async () => {
    repository.findById.mockResolvedValue(makeTag());

    await useCase.execute({ id: 'tag-1', userId: USER_ID });

    expect(deleteTag).toHaveBeenCalledWith('tag-1');
  });

  it('não revela nem remove uma tag de outro usuário', async () => {
    repository.findById.mockResolvedValue(makeTag(OTHER_USER_ID));

    await expect(
      useCase.execute({ id: 'tag-1', userId: USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(deleteTag).not.toHaveBeenCalled();
  });

  it('retorna not found quando a tag não existe', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'tag-1', userId: USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(deleteTag).not.toHaveBeenCalled();
  });
});

import { ConflictException, NotFoundException } from '@nestjs/common';
import { TagEntity } from '@/tag/domain/entities/tag.entity';
import { TagRepository } from '@/tag/domain/repositories/tag.repository';
import { UserEntity } from '@/user/domain/entities/user.entity';
import { UserRepository } from '@/user/domain/repositories/user.repository';
import { CreateTagUseCase } from '../../create-tag.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';

function makeUser() {
  return new UserEntity(
    {
      name: 'Lucas Lopes',
      email: 'lucas@example.com',
      password: 'hashed-secret',
    },
    USER_ID,
  );
}

function makeTag() {
  return new TagEntity(
    {
      userId: USER_ID,
      name: 'NestJS',
    },
    'tag-1',
  );
}

describe('CreateTagUseCase', () => {
  let tagRepository: jest.Mocked<TagRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: CreateTagUseCase;
  let findByNormalizedName: jest.Mock;
  let insert: jest.Mock;
  let findById: jest.Mock;

  beforeEach(() => {
    findByNormalizedName = jest.fn();
    insert = jest.fn();
    findById = jest.fn();
    tagRepository = {
      findByNormalizedName,
      insert,
    } as unknown as jest.Mocked<TagRepository>;
    userRepository = {
      findById,
    } as unknown as jest.Mocked<UserRepository>;
    useCase = new CreateTagUseCase(tagRepository, userRepository);
  });

  it('cria uma tag quando ela ainda não existe para o usuário', async () => {
    findById.mockResolvedValue(makeUser());
    findByNormalizedName.mockResolvedValue(null);

    const output = await useCase.execute({
      name: 'NestJS',
      userId: USER_ID,
    });

    expect(findByNormalizedName).toHaveBeenCalledWith('nestjs', USER_ID);
    expect(insert).toHaveBeenCalledWith(expect.any(TagEntity));
    expect(output.name).toBe('NestJS');
  });

  it('rejeita uma tag que já existe após a normalização do nome', async () => {
    findById.mockResolvedValue(makeUser());
    findByNormalizedName.mockResolvedValue(makeTag());

    await expect(
      useCase.execute({
        name: ' nestjs ',
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(findByNormalizedName).toHaveBeenCalledWith('nestjs', USER_ID);
    expect(insert).not.toHaveBeenCalled();
  });

  it('não cria a tag quando o usuário não existe', async () => {
    findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ name: 'NestJS', userId: USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(findByNormalizedName).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });
});

import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { UserEntity } from '@/user/domain/entities/user.entity';
import { User } from '@generated/prisma/client';
import { UserPrismaRepository } from '../../user-prisma.repository';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const timestamp = new Date('2026-08-01T00:00:00.000Z');

function makeEntity(): UserEntity {
  return new UserEntity(
    {
      name: 'Lucas Lopes',
      email: 'lucas@example.com',
      password: 'hashed-password',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    USER_ID,
  );
}

function makeModel(): User {
  return {
    id: USER_ID,
    name: 'Lucas Lopes',
    email: 'lucas@example.com',
    passwordHash: 'hashed-password',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe('UserPrismaRepository', () => {
  const create = jest.fn();
  const update = jest.fn();
  const findMany = jest.fn();
  const findUnique = jest.fn();
  const deleteUser = jest.fn();
  const prismaService = {
    user: { create, update, findMany, findUnique, delete: deleteUser },
  } as unknown as PrismaService;
  const repository = new UserPrismaRepository(prismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    create.mockResolvedValue(undefined);
    update.mockResolvedValue(undefined);
    findMany.mockResolvedValue([]);
    findUnique.mockResolvedValue(null);
    deleteUser.mockResolvedValue(undefined);
  });

  it('insere o usuário traduzindo password para passwordHash', async () => {
    await repository.insert(makeEntity());

    expect(create).toHaveBeenCalledWith({
      data: {
        id: USER_ID,
        name: 'Lucas Lopes',
        email: 'lucas@example.com',
        passwordHash: 'hashed-password',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
  });

  it('atualiza somente os campos mutáveis do usuário', async () => {
    await repository.update(makeEntity());

    expect(update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: {
        name: 'Lucas Lopes',
        email: 'lucas@example.com',
        passwordHash: 'hashed-password',
        updatedAt: timestamp,
      },
    });
  });

  it('lista modelos convertidos em entidades', async () => {
    findMany.mockResolvedValue([makeModel()]);

    await expect(repository.findAll()).resolves.toEqual([
      expect.objectContaining({ id: USER_ID, password: 'hashed-password' }),
    ]);
    expect(findMany).toHaveBeenCalledWith();
  });

  it.each([
    ['id', () => repository.findById(USER_ID), { id: USER_ID }],
    [
      'e-mail',
      () => repository.findByEmail('lucas@example.com'),
      { email: 'lucas@example.com' },
    ],
  ])('busca por %s e converte o resultado', async (_field, execute, where) => {
    findUnique.mockResolvedValue(makeModel());

    await expect(execute()).resolves.toMatchObject({ id: USER_ID });
    expect(findUnique).toHaveBeenCalledWith({ where });
  });

  it('retorna null quando o usuário não existe', async () => {
    await expect(repository.findById(USER_ID)).resolves.toBeNull();
    await expect(
      repository.findByEmail('missing@example.com'),
    ).resolves.toBeNull();
  });

  it('remove o usuário pelo id', async () => {
    await repository.delete(USER_ID);

    expect(deleteUser).toHaveBeenCalledWith({ where: { id: USER_ID } });
  });
});

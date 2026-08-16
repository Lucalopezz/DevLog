import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HashProvider } from '@/shared/application/providers/hash-provaider';
import { UserEntity } from '@/user/domain/entities/user.entity';
import { UserRepository } from '@/user/domain/repositories/user.repository';
import { CreateUserUseCase } from '../create-user.usecase';
import { FindUserByEmailUseCase } from '../find-user-by-email.usecase';
import { GetCurrentUserUseCase } from '../get-current-user.usecase';
import { UpdateUserPasswordUseCase } from '../update-user-password.usecase';
import { UpdateUserUseCase } from '../update-user.usecase';

class InMemoryUserRepository implements UserRepository {
  users: UserEntity[] = [];

  insert(entity: UserEntity): Promise<void> {
    this.users.push(entity);
    return Promise.resolve();
  }

  update(entity: UserEntity): Promise<void> {
    const index = this.users.findIndex((user) => user.id === entity.id);
    this.users[index] = entity;
    return Promise.resolve();
  }

  findById(id: string): Promise<UserEntity | null> {
    return Promise.resolve(this.users.find((user) => user.id === id) ?? null);
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return Promise.resolve(
      this.users.find((user) => user.email === email) ?? null,
    );
  }

  findAll(): Promise<UserEntity[]> {
    return Promise.resolve(this.users);
  }

  delete(id: string): Promise<void> {
    this.users = this.users.filter((user) => user.id !== id);
    return Promise.resolve();
  }
}

class StubHashProvider implements HashProvider {
  generateHash(payload: string): Promise<string> {
    return Promise.resolve(`hashed-${payload}`);
  }

  compareHash(payload: string, hash: string): Promise<boolean> {
    return Promise.resolve(`hashed-${payload}` === hash);
  }
}

function makeUser(
  overrides: Partial<{
    id: string;
    name: string;
    email: string;
    password: string;
  }> = {},
) {
  return new UserEntity(
    {
      name: overrides.name ?? 'Lucas Lopes',
      email: overrides.email ?? 'lucas@example.com',
      password: overrides.password ?? 'hashed-secret',
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    },
    overrides.id,
  );
}

describe('Casos de uso de usuário', () => {
  describe('CreateUserUseCase', () => {
    it('cria um usuário quando o e-mail está disponível', async () => {
      const repository = new InMemoryUserRepository();
      const useCase = new CreateUserUseCase(repository, new StubHashProvider());

      const output = await useCase.execute({
        name: 'Lucas Lopes',
        email: 'lucas@example.com',
        password: 'secret',
        confirmPassword: 'secret',
      });

      expect(repository.users).toHaveLength(1);
      expect(repository.users[0].password).toBe('hashed-secret');
      expect(output.email).toBe('lucas@example.com');
    });

    it('rejeita um e-mail já cadastrado', async () => {
      const repository = new InMemoryUserRepository();
      repository.users.push(makeUser());
      const useCase = new CreateUserUseCase(repository, new StubHashProvider());

      await expect(
        useCase.execute({
          name: 'Another User',
          email: 'lucas@example.com',
          password: 'secret',
          confirmPassword: 'secret',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejeita senhas de confirmação diferentes como entrada inválida', async () => {
      const useCase = new CreateUserUseCase(
        new InMemoryUserRepository(),
        new StubHashProvider(),
      );

      await expect(
        useCase.execute({
          name: 'Lucas Lopes',
          email: 'lucas@example.com',
          password: 'secret',
          confirmPassword: 'different-secret',
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  describe('GetCurrentUserUseCase', () => {
    it('retorna o usuário identificado pelo contexto autenticado', async () => {
      const repository = new InMemoryUserRepository();
      const user = makeUser();
      repository.users.push(user);
      const useCase = new GetCurrentUserUseCase(repository);

      await expect(useCase.execute({ id: user.id })).resolves.toMatchObject({
        id: user.id,
        email: user.email,
      });
    });

    it('falha quando o usuário não existe', async () => {
      const useCase = new GetCurrentUserUseCase(new InMemoryUserRepository());

      await expect(
        useCase.execute({ id: 'missing-user' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('FindUserByEmailUseCase', () => {
    it('retorna os dados públicos do usuário encontrado pelo e-mail', async () => {
      const repository = new InMemoryUserRepository();
      const user = makeUser();
      repository.users.push(user);
      const useCase = new FindUserByEmailUseCase(repository);

      await expect(
        useCase.execute({ email: user.email }),
      ).resolves.toMatchObject({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    });

    it('falha quando nenhum usuário possui o e-mail solicitado', async () => {
      const useCase = new FindUserByEmailUseCase(new InMemoryUserRepository());

      await expect(
        useCase.execute({ email: 'missing@example.com' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('UpdateUserUseCase', () => {
    it('atualiza o nome e persiste a mesma entidade', async () => {
      const repository = new InMemoryUserRepository();
      const user = makeUser();
      repository.users.push(user);
      const useCase = new UpdateUserUseCase(repository);

      await useCase.execute({
        userId: user.id,
        name: 'Updated User',
      });

      expect(user.name).toBe('Updated User');
      expect(user.email).toBe('lucas@example.com');
    });
  });

  describe('UpdateUserPasswordUseCase', () => {
    it('gera hash e persiste uma nova senha', async () => {
      const repository = new InMemoryUserRepository();
      const user = makeUser();
      repository.users.push(user);
      const useCase = new UpdateUserPasswordUseCase(
        repository,
        new StubHashProvider(),
      );

      await useCase.execute({
        userId: user.id,
        currentPassword: 'secret',
        password: 'new-secret',
        confirmPassword: 'new-secret',
      });

      expect(user.password).toBe('hashed-new-secret');
    });

    it('rejeita uma senha atual incorreta', async () => {
      const repository = new InMemoryUserRepository();
      const user = makeUser();
      repository.users.push(user);
      const useCase = new UpdateUserPasswordUseCase(
        repository,
        new StubHashProvider(),
      );

      await expect(
        useCase.execute({
          userId: user.id,
          currentPassword: 'wrong-secret',
          password: 'new-secret',
          confirmPassword: 'new-secret',
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('rejeita senhas de confirmação diferentes como entrada inválida', async () => {
      const repository = new InMemoryUserRepository();
      const user = makeUser();
      repository.users.push(user);
      const useCase = new UpdateUserPasswordUseCase(
        repository,
        new StubHashProvider(),
      );

      await expect(
        useCase.execute({
          userId: user.id,
          currentPassword: 'secret',
          password: 'new-secret',
          confirmPassword: 'different-secret',
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });
});

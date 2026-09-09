import { UnauthorizedException } from '@nestjs/common';
import { HashProvider } from '@/shared/application/providers/hash-provaider';
import { UserEntity } from '@/user/domain/entities/user.entity';
import { UserRepository } from '@/user/domain/repositories/user.repository';
import { TokenProvider } from '../../../providers/token-provider';
import { AuthenticateUserUseCase } from '../../authenticate-user.usecase';

function makeUser(): UserEntity {
  return new UserEntity(
    {
      name: 'Lucas Lopes',
      email: 'lucas@example.com',
      password: 'hashed-password',
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    },
    'user-id',
  );
}

describe('AuthenticateUserUseCase', () => {
  const findByEmail = jest.fn();
  const compareHash = jest.fn();
  const generate = jest.fn();
  const repository = {
    findByEmail,
  } as unknown as UserRepository;
  const hashProvider = {
    compareHash,
  } as unknown as HashProvider;
  const tokenProvider = {
    generate,
  } as unknown as TokenProvider;
  const useCase = new AuthenticateUserUseCase(
    repository,
    hashProvider,
    tokenProvider,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a token and public user data for valid credentials', async () => {
    const user = makeUser();
    findByEmail.mockResolvedValue(user);
    compareHash.mockResolvedValue(true);
    generate.mockResolvedValue('access-token');

    await expect(
      useCase.execute({ email: user.email, password: 'password' }),
    ).resolves.toEqual({
      accessToken: 'access-token',
      user: { id: user.id, name: user.name, email: user.email },
    });

    expect(compareHash).toHaveBeenCalledWith('password', 'hashed-password');
    expect(generate).toHaveBeenCalledWith({ sub: user.id });
  });

  it('rejects an unknown email without comparing the password', async () => {
    findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'missing@example.com', password: 'password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(compareHash).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
  });

  it('rejects an invalid password without issuing a token', async () => {
    findByEmail.mockResolvedValue(makeUser());
    compareHash.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'lucas@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(generate).not.toHaveBeenCalled();
  });
});

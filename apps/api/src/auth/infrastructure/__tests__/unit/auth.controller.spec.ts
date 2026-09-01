import { Response } from 'express';
import { AuthenticateUserUseCase } from '@/auth/application/usecases/authenticate-user.usecase';
import { ACCESS_TOKEN_COOKIE } from '../../constants/auth.constants';
import { AuthController } from '../../auth.controller';

function makeResponse() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as jest.Mocked<Response>;
}

describe('AuthController', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const execute = jest.fn();
  const useCase = {
    execute,
  } as unknown as jest.Mocked<AuthenticateUserUseCase>;
  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController();
    Reflect.set(controller, 'authenticateUserUseCase', useCase);
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
      return;
    }
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('faz login, grava o token em cookie protegido e retorna somente o usuário', async () => {
    const response = makeResponse();
    const user = { id: 'user-id', name: 'Lucas', email: 'lucas@example.com' };
    execute.mockResolvedValue({ accessToken: 'access-token', user });

    await expect(
      controller.login({ email: user.email, password: 'password' }, response),
    ).resolves.toEqual(user);

    expect(execute).toHaveBeenCalledWith({
      email: user.email,
      password: 'password',
    });
    expect(response.cookie.mock.calls).toEqual([
      [
        ACCESS_TOKEN_COOKIE,
        'access-token',
        {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 60 * 60 * 1000,
          path: '/',
        },
      ],
    ]);
  });

  it('habilita o atributo secure do cookie em produção', async () => {
    process.env.NODE_ENV = 'production';
    const response = makeResponse();
    execute.mockResolvedValue({
      accessToken: 'access-token',
      user: { id: 'user-id', name: 'Lucas', email: 'lucas@example.com' },
    });

    await controller.login(
      { email: 'lucas@example.com', password: 'password' },
      response,
    );

    expect(response.cookie.mock.calls[0]?.[2]).toEqual(
      expect.objectContaining({ secure: true }),
    );
  });

  it('remove o cookie com os mesmos atributos relevantes no logout', () => {
    const response = makeResponse();

    controller.logout(response);

    expect(response.clearCookie.mock.calls).toEqual([
      [
        ACCESS_TOKEN_COOKIE,
        {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
        },
      ],
    ]);
  });
});

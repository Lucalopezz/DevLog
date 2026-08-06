import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenProvider } from '@/auth/application/providers/token-provider';
import { ACCESS_TOKEN_COOKIE } from '../constants/auth.constants';
import { AuthGuard } from '../auth.guard';

function makeContext(request: object): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
}

describe('AuthGuard', () => {
  const verify = jest.fn();
  const tokenProvider = {
    verify,
  } as unknown as TokenProvider;
  const guard = new AuthGuard(tokenProvider);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adiciona o usuário autenticado à requisição para um token de cookie válido', async () => {
    const request = { cookies: { [ACCESS_TOKEN_COOKIE]: 'valid-token' } };
    verify.mockResolvedValue({ sub: 'user-id' });

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);

    expect(verify).toHaveBeenCalledWith('valid-token');
    expect(request).toMatchObject({ user: { id: 'user-id' } });
  });

  it('rejeita uma requisição sem o cookie do token de acesso', async () => {
    await expect(
      guard.canActivate(makeContext({ cookies: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(verify).not.toHaveBeenCalled();
  });

  it.each([
    ['o token não pode ser verificado', undefined, new Error('invalid token')],
    ['o payload não possui subject', {}, undefined],
  ])('rejeita quando %s', async (_description, payload, error) => {
    if (error) {
      verify.mockRejectedValue(error);
    } else {
      verify.mockResolvedValue(payload);
    }

    await expect(
      guard.canActivate(
        makeContext({ cookies: { [ACCESS_TOKEN_COOKIE]: 'invalid-token' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

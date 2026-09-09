import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from '../../jwt-token.service';

describe('JwtTokenService', () => {
  const signAsync = jest.fn();
  const verifyAsync = jest.fn();
  const jwtService = { signAsync, verifyAsync } as unknown as JwtService;
  const service = new JwtTokenService(jwtService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates token generation to JwtService', async () => {
    signAsync.mockResolvedValue('signed-token');

    await expect(service.generate({ sub: 'user-id' })).resolves.toBe(
      'signed-token',
    );
    expect(signAsync).toHaveBeenCalledWith({ sub: 'user-id' });
  });

  it('delegates verification and returns the typed payload', async () => {
    verifyAsync.mockResolvedValue({ sub: 'user-id' });

    await expect(service.verify('signed-token')).resolves.toEqual({
      sub: 'user-id',
    });
    expect(verifyAsync).toHaveBeenCalledWith('signed-token');
  });

  it('propagates signing and verification failures', async () => {
    const signingError = new Error('sign failed');
    const verificationError = new Error('verify failed');
    signAsync.mockRejectedValue(signingError);
    verifyAsync.mockRejectedValue(verificationError);

    await expect(service.generate({ sub: 'user-id' })).rejects.toBe(
      signingError,
    );
    await expect(service.verify('invalid-token')).rejects.toBe(
      verificationError,
    );
  });
});

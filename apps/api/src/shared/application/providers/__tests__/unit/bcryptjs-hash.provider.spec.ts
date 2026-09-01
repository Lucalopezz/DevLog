import { BcryptjsHashProvider } from '../../bycryptjs-hash.provider';

describe('BcryptjsHashProvider', () => {
  const provider = new BcryptjsHashProvider();

  it('gera um hash que pode ser comparado com o valor original', async () => {
    const hash = await provider.generateHash('secret');

    expect(hash).not.toBe('secret');
    await expect(provider.compareHash('secret', hash)).resolves.toBe(true);
  });

  it('não aceita um valor diferente para o mesmo hash', async () => {
    const hash = await provider.generateHash('secret');

    await expect(provider.compareHash('other-secret', hash)).resolves.toBe(
      false,
    );
  });
});

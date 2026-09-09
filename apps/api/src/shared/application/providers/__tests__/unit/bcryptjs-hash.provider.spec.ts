import { BcryptjsHashProvider } from '../../bycryptjs-hash.provider';

describe('BcryptjsHashProvider', () => {
  const provider = new BcryptjsHashProvider();

  it('generates a hash that can be compared with the original value', async () => {
    const hash = await provider.generateHash('secret');

    expect(hash).not.toBe('secret');
    await expect(provider.compareHash('secret', hash)).resolves.toBe(true);
  });

  it('rejects a different value for the same hash', async () => {
    const hash = await provider.generateHash('secret');

    await expect(provider.compareHash('other-secret', hash)).resolves.toBe(
      false,
    );
  });
});

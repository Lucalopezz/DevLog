import { ConfigService } from '@nestjs/config';
import { EnvConfigService } from '../../env-config.service';

function makeService(values: Record<string, unknown> = {}) {
  const configService = {
    get: jest.fn((key: string, defaultValue?: unknown) =>
      key in values ? values[key] : defaultValue,
    ),
  } as unknown as ConfigService;

  return new EnvConfigService(configService);
}

describe('EnvConfigService', () => {
  it('uses safe development defaults when optional values are absent', () => {
    const service = makeService();

    expect(service.getAppPort()).toBe(3000);
    expect(service.getJwtExpiresInSeconds()).toBe(3600);
    expect(service.getNodeEnv()).toBe('development');
    expect(service.getCorsAllowedOrigins()).toEqual([]);
  });

  it('normalizes configured CORS origins', () => {
    const service = makeService({
      CORS_ALLOWED_ORIGINS: ' https://app.dev , ,https://admin.dev ',
    });

    expect(service.getCorsAllowedOrigins()).toEqual([
      'https://app.dev',
      'https://admin.dev',
    ]);
  });

  it('allows a wildcard origin only in development', () => {
    const service = makeService({
      NODE_ENV: 'production',
      CORS_ALLOWED_ORIGINS: '*',
    });

    expect(() => service.getCorsAllowedOrigins()).toThrow(
      'CORS_ALLOWED_ORIGINS cannot contain "*" outside development',
    );
  });

  it('requires a JWT secret', () => {
    expect(() => makeService().getJwtSecret()).toThrow(
      'JWT_SECRET is required',
    );
    expect(makeService({ JWT_SECRET: 'secret' }).getJwtSecret()).toBe('secret');
  });
});

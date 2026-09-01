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
  it('usa valores padrão seguros de desenvolvimento quando os opcionais estão ausentes', () => {
    const service = makeService();

    expect(service.getAppPort()).toBe(3000);
    expect(service.getJwtExpiresInSeconds()).toBe(3600);
    expect(service.getNodeEnv()).toBe('development');
    expect(service.getCorsAllowedOrigins()).toEqual([]);
  });

  it('normaliza as origens de CORS configuradas', () => {
    const service = makeService({
      CORS_ALLOWED_ORIGINS: ' https://app.dev , ,https://admin.dev ',
    });

    expect(service.getCorsAllowedOrigins()).toEqual([
      'https://app.dev',
      'https://admin.dev',
    ]);
  });

  it('permite a origem curinga somente em desenvolvimento', () => {
    const service = makeService({
      NODE_ENV: 'production',
      CORS_ALLOWED_ORIGINS: '*',
    });

    expect(() => service.getCorsAllowedOrigins()).toThrow(
      'CORS_ALLOWED_ORIGINS cannot contain "*" outside development',
    );
  });

  it('exige um segredo JWT', () => {
    expect(() => makeService().getJwtSecret()).toThrow(
      'JWT_SECRET is required',
    );
    expect(makeService({ JWT_SECRET: 'secret' }).getJwtSecret()).toBe('secret');
  });
});

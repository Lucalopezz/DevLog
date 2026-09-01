import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../shared/infrastructure/env-config/env-config.service';
import { UuidParamValidationPipe } from '../../shared/infrastructure/pipes/uuid-param-validation.pipe';
import { applyGlobalConfig } from '../../global-config';

describe('applyGlobalConfig', () => {
  it('registra a validação global de UUIDs nos parâmetros de rota', () => {
    const useGlobalPipes = jest.fn();
    const useGlobalFilters = jest.fn();
    const app = {
      setGlobalPrefix: jest.fn(),
      use: jest.fn(),
      useGlobalPipes,
      enableCors: jest.fn(),
      useGlobalInterceptors: jest.fn(),
      useGlobalFilters,
      get: jest.fn().mockReturnValue(new Reflector()),
    } as unknown as INestApplication;
    const envConfigService = {
      getCorsAllowedOrigins: jest.fn().mockReturnValue([]),
    } as unknown as EnvConfigService;

    applyGlobalConfig(app, envConfigService);

    expect(useGlobalPipes).toHaveBeenCalledWith(
      expect.any(UuidParamValidationPipe),
      expect.any(ValidationPipe),
    );
    expect(useGlobalFilters).toHaveBeenCalledWith(expect.anything());
  });
});

import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { EnvConfigService } from './shared/infrastructure/env-config/env-config.service';
import { Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { UuidParamValidationPipe } from './shared/infrastructure/pipes/uuid-param-validation.pipe';

export function applyGlobalConfig(
  app: INestApplication,
  envConfigService: EnvConfigService,
) {
  const corsAllowedOrigins = envConfigService.getCorsAllowedOrigins();

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(
    new UuidParamValidationPipe(),
    new ValidationPipe({
      errorHttpStatusCode: 422,
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: corsAllowedOrigins.length > 0 ? corsAllowedOrigins : false,
    credentials: true,
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });
  app.useGlobalInterceptors(
    // new WrapperDataInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
  // app.useGlobalFilters(
  //   new ConflictErrorFilter(),
  //   new NotFoundErrorFilter(),
  //   new InvalidPasswordErrorFilter(),
  //   new InvalidCredentialsErrorFilter(),
  //   new UnauthorizedErrorFilter(),
  // );
}

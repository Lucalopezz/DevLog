import {
  ClassSerializerInterceptor,
  HttpStatus,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { EnvConfigService } from './shared/infrastructure/env-config/env-config.service';
import { Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { UuidParamValidationPipe } from './shared/infrastructure/pipes/uuid-param-validation.pipe';
import { EntityValidationErrorFilter } from './shared/infrastructure/filters/entity-validation-error.filter';

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
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
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
  app.useGlobalFilters(new EntityValidationErrorFilter());
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

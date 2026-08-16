import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';

@Catch(EntityValidationError)
export class EntityValidationErrorFilter implements ExceptionFilter<EntityValidationError> {
  catch(exception: EntityValidationError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = HttpStatus.UNPROCESSABLE_ENTITY;

    response.status(statusCode).json({
      statusCode,
      message: exception.error,
      error: 'Unprocessable Entity',
    });
  }
}

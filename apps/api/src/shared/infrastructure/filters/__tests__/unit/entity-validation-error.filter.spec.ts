import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { EntityValidationErrorFilter } from '../../entity-validation-error.filter';

describe('EntityValidationErrorFilter', () => {
  it('converte erro de validação da entidade em resposta 422', () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;
    const exception = new EntityValidationError({
      name: ['O nome é obrigatório'],
    });

    new EntityValidationErrorFilter().catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: exception.error,
      error: 'Unprocessable Entity',
    });
  });
});

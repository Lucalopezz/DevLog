import { ArgumentMetadata, UnprocessableEntityException } from '@nestjs/common';
import { UuidParamValidationPipe } from './uuid-param-validation.pipe';

const UUID = '123e4567-e89b-42d3-a456-426614174000';

describe('UuidParamValidationPipe', () => {
  const pipe = new UuidParamValidationPipe();

  it.each(['id', 'projectId', 'entryId'])(
    'aceita UUID v4 no parâmetro de rota %s',
    async (paramName) => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: paramName,
        metatype: String,
      };

      await expect(pipe.transform(UUID, metadata)).resolves.toBe(UUID);
    },
  );

  it('rejeita UUID inválido no parâmetro id da rota', async () => {
    const metadata: ArgumentMetadata = {
      type: 'param',
      data: 'id',
      metatype: String,
    };

    await expect(pipe.transform('not-a-uuid', metadata)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('não valida parâmetros que não representam IDs de rota', async () => {
    const metadata: ArgumentMetadata = {
      type: 'param',
      data: 'slug',
      metatype: String,
    };

    await expect(pipe.transform('not-a-uuid', metadata)).resolves.toBe(
      'not-a-uuid',
    );
  });

  it.each(['body', 'query'] as const)(
    'não valida valores de %s',
    async (type) => {
      const metadata: ArgumentMetadata = {
        type,
        data: 'title',
        metatype: String,
      };

      await expect(pipe.transform('texto', metadata)).resolves.toBe('texto');
    },
  );
});

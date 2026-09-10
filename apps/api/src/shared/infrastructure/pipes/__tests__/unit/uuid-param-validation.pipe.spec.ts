import { ArgumentMetadata, UnprocessableEntityException } from '@nestjs/common';
import { UuidParamValidationPipe } from '../../uuid-param-validation.pipe';

const UUID = '123e4567-e89b-42d3-a456-426614174000';

describe('UuidParamValidationPipe', () => {
  const pipe = new UuidParamValidationPipe();

  it.each(['id', 'projectId', 'entryId'])(
    'accepts UUID v4 in route parameter %s',
    async (paramName) => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: paramName,
        metatype: String,
      };

      await expect(pipe.transform(UUID, metadata)).resolves.toBe(UUID);
    },
  );

  it('rejects an invalid UUID in the route id parameter', async () => {
    const metadata: ArgumentMetadata = {
      type: 'param',
      data: 'id',
      metatype: String,
    };

    await expect(pipe.transform('not-a-uuid', metadata)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('does not validate parameters that are not route IDs', async () => {
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
    'does not validate %s values',
    async (type) => {
      const metadata: ArgumentMetadata = {
        type,
        data: 'title',
        metatype: String,
      };

      await expect(pipe.transform('text', metadata)).resolves.toBe('text');
    },
  );
});

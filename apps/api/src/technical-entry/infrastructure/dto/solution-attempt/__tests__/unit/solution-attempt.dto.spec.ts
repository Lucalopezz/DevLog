import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SolutionAttemptResult } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt-result.enum';
import { AddSolutionAttemptDto } from '../../add-solution-attempt.dto';
import { UpdateSolutionAttemptDto } from '../../update-solution-attempt.dto';
import { ListSolutionAttemptsDto } from '../../list-solution-attempts.dto';

const options = { whitelist: true, forbidNonWhitelisted: true };

describe('solution attempt HTTP DTOs', () => {
  it.each(Object.values(SolutionAttemptResult))(
    'accepts a %s attempt',
    async (result) => {
      expect(
        await validate(
          plainToInstance(AddSolutionAttemptDto, {
            description: 'Test the cache invalidation hypothesis',
            result,
          }),
          options,
        ),
      ).toEqual([]);
    },
  );

  it.each([
    ['description', ''],
    ['description', null],
    ['description', 123],
    ['result', 'UNKNOWN'],
    ['result', null],
  ])('rejects invalid %s input %p', async (property, value) => {
    const errors = await validate(
      plainToInstance(AddSolutionAttemptDto, {
        description: 'Test a hypothesis',
        result: 'FAILED',
        [property]: value,
      }),
      options,
    );
    expect(errors.map((error) => error.property)).toContain(property);
  });

  it('allows editing the description but rejects result and parent changes', async () => {
    expect(
      await validate(
        plainToInstance(UpdateSolutionAttemptDto, {
          description: 'Explain why the attempt failed',
        }),
        options,
      ),
    ).toEqual([]);
    const errors = await validate(
      plainToInstance(UpdateSolutionAttemptDto, {
        description: '',
        result: 'SUCCESSFUL',
        technicalEntryId: 'another-entry',
      }),
      options,
    );
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['description', 'result', 'technicalEntryId']),
    );
  });

  it('transforms pagination and accepts supported result and sort filters', async () => {
    const dto = plainToInstance(ListSolutionAttemptsDto, {
      page: '2',
      perPage: '5',
      result: 'PARTIAL',
      sort: 'createdAt',
      sortDir: 'desc',
    });
    expect(await validate(dto, options)).toEqual([]);
    expect(dto).toMatchObject({ page: 2, perPage: 5, result: 'PARTIAL' });
  });

  it.each([
    ['page', '0'],
    ['perPage', '1.5'],
    ['result', 'OPEN'],
    ['sort', 'description'],
    ['sortDir', 'up'],
  ])('rejects unsupported %s filter %p', async (property, value) => {
    const errors = await validate(
      plainToInstance(ListSolutionAttemptsDto, {
        [property]: value,
      }),
      options,
    );
    expect(errors.map((error) => error.property)).toContain(property);
  });
});

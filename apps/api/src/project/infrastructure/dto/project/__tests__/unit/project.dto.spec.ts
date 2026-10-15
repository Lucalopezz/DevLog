import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProjectDto } from '../../create-project.dto';
import { SearchProjectDto } from '../../search-project.dto';

const options = { whitelist: true, forbidNonWhitelisted: true };

describe('CreateProjectDto', () => {
  it.each([3, 150])('accepts a %i-character name', async (length) => {
    expect(
      await validate(
        plainToInstance(CreateProjectDto, {
          name: 'a'.repeat(length),
          description: 'Study project',
        }),
        options,
      ),
    ).toEqual([]);
  });

  it.each(['', 'ab', 'a'.repeat(151), null, 123])(
    'rejects invalid name %p',
    async (name) => {
      const errors = await validate(
        plainToInstance(CreateProjectDto, { name }),
        options,
      );
      expect(errors.map((error) => error.property)).toContain('name');
    },
  );

  it('rejects ownership and archive state supplied in the request body', async () => {
    const errors = await validate(
      plainToInstance(CreateProjectDto, {
        name: 'DevLog',
        userId: 'another-user',
        archivedAt: '2026-10-01',
      }),
      options,
    );
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['userId', 'archivedAt']),
    );
  });
});

describe('SearchProjectDto', () => {
  it('transforms query strings into numbers and an archive date', async () => {
    const dto = plainToInstance(SearchProjectDto, {
      page: '2',
      perPage: '5',
      status: 'ACTIVE',
      sort: 'name',
      sortDir: 'asc',
      archivedAt: '2026-10-01T12:00:00Z',
    });
    expect(await validate(dto, options)).toEqual([]);
    expect(dto).toMatchObject({
      page: 2,
      perPage: 5,
      archivedAt: new Date('2026-10-01T12:00:00Z'),
    });
  });

  it('preserves the null archive sentinel used to request active projects', async () => {
    const dto = plainToInstance(SearchProjectDto, { archivedAt: 'null' });
    expect(await validate(dto, options)).toEqual([]);
    expect(dto.archivedAt).toBeNull();
  });

  it.each([
    ['page', '0'],
    ['page', '1.5'],
    ['perPage', '-1'],
    ['perPage', 'many'],
    ['archivedAt', 'invalid-date'],
    ['status', 'ARCHIVED'],
    ['sortDir', 'up'],
  ])('rejects invalid %s query %p', async (property, value) => {
    const errors = await validate(
      plainToInstance(SearchProjectDto, {
        [property]: value,
      }),
      options,
    );
    expect(errors.map((error) => error.property)).toContain(property);
  });
});

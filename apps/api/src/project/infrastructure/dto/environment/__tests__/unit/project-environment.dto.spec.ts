import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AddProjectEnvironmentDto } from '../../add-project-environment.dto';
import { UpdateProjectEnvironmentDto } from '../../update-project-environment.dto';
import { SearchOwnerProjectEnvironmentsDto } from '../../search-project-environment.dto';

const options = { whitelist: true, forbidNonWhitelisted: true };
describe('environment HTTP DTOs', () => {
  it('rejects unsupported categories, oversized fields, and extra fields', async () => {
    const dto = plainToInstance(AddProjectEnvironmentDto, {
      name: 'Local',
      category: 'INVALID',
      runtimeVersion: 'x'.repeat(51),
      secret: 'never store this',
    });
    const errors = await validate(dto, options);
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['category', 'runtimeVersion', 'secret']),
    );
  });
  it('accepts null clears but rejects null required update fields', async () => {
    expect(
      await validate(
        plainToInstance(UpdateProjectEnvironmentDto, { runtime: null }),
        options,
      ),
    ).toEqual([]);
    const errors = await validate(
      plainToInstance(UpdateProjectEnvironmentDto, {
        name: null,
        category: null,
      }),
      options,
    );
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['name', 'category']),
    );
  });
  it('rejects invalid global filters', async () => {
    const dto = plainToInstance(SearchOwnerProjectEnvironmentsDto, {
      category: 'INVALID',
      projectId: 'not-a-uuid',
      page: '0',
    });
    expect(
      (await validate(dto, options)).map((error) => error.property),
    ).toEqual(expect.arrayContaining(['category', 'projectId', 'page']));
  });
});

import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProjectResourceType } from '@/project/domain/entities/resource/project-resource-type.enum';
import { AddProjectResourceDto } from '../../add-project-resource.dto';
import { SearchProjectResourceDto } from '../../search-project-resource.dto';
import { UpdateProjectResourceDto } from '../../update-project-resource.dto';

describe('AddProjectResourceDto', () => {
  it('accepts a valid resource without an explicit type', async () => {
    const dto = plainToInstance(AddProjectResourceDto, {
      label: 'Figma',
      url: 'https://figma.com/file/devlog',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects invalid URL and type', async () => {
    const dto = plainToInstance(AddProjectResourceDto, {
      label: 'Invalid resource',
      url: 'not-a-url',
      type: 'UNKNOWN',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['url', 'type']),
    );
  });
});

describe('UpdateProjectResourceDto', () => {
  it('accepts partial updates', async () => {
    const dto = plainToInstance(UpdateProjectResourceDto, {
      type: ProjectResourceType.DOCUMENTATION,
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects null values and an invalid URL', async () => {
    const dto = plainToInstance(UpdateProjectResourceDto, {
      label: null,
      url: 'not-a-url',
      type: null,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['label', 'url', 'type']),
    );
  });
});

describe('SearchProjectResourceDto', () => {
  it('transforms pagination and accepts valid filters', async () => {
    const dto = plainToInstance(SearchProjectResourceDto, {
      page: '2',
      perPage: '10',
      type: ProjectResourceType.REPOSITORY,
      sortDir: 'desc',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ page: 2, perPage: 10 });
  });

  it('rejects invalid pagination, type, and direction', async () => {
    const dto = plainToInstance(SearchProjectResourceDto, {
      page: '0',
      type: 'UNKNOWN',
      sortDir: 'sideways',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['page', 'type', 'sortDir']),
    );
  });
});

import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProjectResourceType } from '@/project/domain/entities/project-resource-type.enum';
import { AddProjectResourceDto } from './add-project-resource.dto';
import { SearchProjectResourceDto } from './search-project-resource.dto';
import { UpdateProjectResourceDto } from './update-project-resource.dto';

describe('AddProjectResourceDto', () => {
  it('aceita um recurso válido sem tipo explícito', async () => {
    const dto = plainToInstance(AddProjectResourceDto, {
      label: 'Figma',
      url: 'https://figma.com/file/devlog',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejeita URL e tipo inválidos', async () => {
    const dto = plainToInstance(AddProjectResourceDto, {
      label: 'Recurso inválido',
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
  it('aceita atualização parcial', async () => {
    const dto = plainToInstance(UpdateProjectResourceDto, {
      type: ProjectResourceType.DOCUMENTATION,
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejeita valores nulos e URL inválida', async () => {
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
  it('transforma paginação e aceita filtros válidos', async () => {
    const dto = plainToInstance(SearchProjectResourceDto, {
      page: '2',
      perPage: '10',
      type: ProjectResourceType.REPOSITORY,
      sortDir: 'desc',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ page: 2, perPage: 10 });
  });

  it('rejeita paginação, tipo e direção inválidos', async () => {
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

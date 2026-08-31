import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateTechnicalEntryDto } from './update-technical-entry.dto';

const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174010';

describe('UpdateTechnicalEntryDto', () => {
  it('aceita title no limite e projectId nulo ou UUID', async () => {
    const withProject = plainToInstance(UpdateTechnicalEntryDto, {
      title: 'a'.repeat(200),
      projectId: PROJECT_ID,
    });
    const withoutProject = plainToInstance(UpdateTechnicalEntryDto, {
      projectId: null,
    });

    expect(await validate(withProject)).toHaveLength(0);
    expect(await validate(withoutProject)).toHaveLength(0);
  });

  it('rejeita projectId inválido e title acima do limite', async () => {
    const dto = plainToInstance(UpdateTechnicalEntryDto, {
      projectId: 'project-1',
      title: 'a'.repeat(201),
    });

    const errors = await validate(dto);
    const properties = errors.map((error) => error.property);

    expect(properties).toEqual(expect.arrayContaining(['projectId', 'title']));
  });

  it('rejeita null em campos não anuláveis', async () => {
    const dto = plainToInstance(UpdateTechnicalEntryDto, {
      title: null,
      context: null,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['title', 'context']),
    );
  });
});

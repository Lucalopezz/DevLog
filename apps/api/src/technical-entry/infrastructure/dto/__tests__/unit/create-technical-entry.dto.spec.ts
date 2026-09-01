import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import { CreateTechnicalEntryDto } from '../../create-technical-entry.dto';

const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174010';

const makeDto = (overrides: Record<string, unknown> = {}) =>
  plainToInstance(CreateTechnicalEntryDto, {
    title: 'Título da entrada',
    context: 'Contexto da entrada',
    type: TechnicalEntryType.ISSUE,
    ...overrides,
  });

describe('CreateTechnicalEntryDto', () => {
  it('aceita projectId UUID e projectId nulo', async () => {
    const withProject = await validate(makeDto({ projectId: PROJECT_ID }));
    const withoutProject = await validate(makeDto({ projectId: null }));

    expect(withProject).toHaveLength(0);
    expect(withoutProject).toHaveLength(0);
  });

  it('rejeita projectId inválido', async () => {
    const errors = await validate(makeDto({ projectId: 'project-1' }));

    expect(errors.map((error) => error.property)).toContain('projectId');
  });

  it('aceita title com 200 caracteres e rejeita 201', async () => {
    const validErrors = await validate(makeDto({ title: 'a'.repeat(200) }));
    const invalidErrors = await validate(makeDto({ title: 'a'.repeat(201) }));

    expect(validErrors.map((error) => error.property)).not.toContain('title');
    expect(invalidErrors.map((error) => error.property)).toContain('title');
  });
});

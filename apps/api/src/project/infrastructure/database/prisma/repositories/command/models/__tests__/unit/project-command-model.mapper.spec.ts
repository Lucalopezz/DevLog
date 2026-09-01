import { ProjectCommandEntity } from '@/project/domain/entities/command/project-command.entity';
import { ValidationError } from '@/shared/domain/errors/validation-error';
import { ProjectCommand } from '@generated/prisma/client';
import { ProjectCommandModelMapper } from '../../project-command-model.mapper';

const timestamp = new Date('2026-08-01T00:00:00.000Z');
const COMMAND_ID = '123e4567-e89b-42d3-a456-426614174020';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174010';

function makeModel(overrides: Partial<ProjectCommand> = {}): ProjectCommand {
  return {
    id: COMMAND_ID,
    projectId: PROJECT_ID,
    title: 'Start API',
    command: 'pnpm --filter api dev',
    description: null,
    executionOrder: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

describe('ProjectCommandModelMapper', () => {
  it('converte nulls persistidos em opcionais do domínio', () => {
    const entity = ProjectCommandModelMapper.toEntity(makeModel());

    expect(entity).toMatchObject({
      id: COMMAND_ID,
      projectId: PROJECT_ID,
      title: 'Start API',
      command: 'pnpm --filter api dev',
    });
    expect(entity.description).toBeUndefined();
    expect(entity.executionOrder).toBeUndefined();
  });

  it('converte opcionais ausentes em null para persistência', () => {
    const entity = new ProjectCommandEntity(
      {
        projectId: PROJECT_ID,
        title: 'Start API',
        command: 'pnpm --filter api dev',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      COMMAND_ID,
    );

    expect(ProjectCommandModelMapper.toPersistence(entity)).toEqual({
      id: COMMAND_ID,
      projectId: PROJECT_ID,
      title: 'Start API',
      command: 'pnpm --filter api dev',
      description: null,
      executionOrder: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  it('encapsula erro de validação ao hidratar uma entidade inválida', () => {
    expect(() =>
      ProjectCommandModelMapper.toEntity(makeModel({ title: '' })),
    ).toThrow(ValidationError);
  });
});

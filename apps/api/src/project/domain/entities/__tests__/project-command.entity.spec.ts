import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import {
  ProjectCommandEntity,
  type ProjectCommandProps,
} from '../project-command.entity';

const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174000';

function makeProps(
  overrides: Partial<ProjectCommandProps> = {},
): ProjectCommandProps {
  const date = new Date('2026-08-01T00:00:00.000Z');

  return {
    projectId: PROJECT_ID,
    title: 'Subir ambiente local',
    command: 'docker compose up -d',
    description: 'Inicia os serviços do projeto',
    executionOrder: 0,
    createdAt: date,
    updatedAt: date,
    ...overrides,
  };
}

describe('ProjectCommandEntity', () => {
  it('cria um comando com ordem de execução opcional', () => {
    const command = new ProjectCommandEntity(
      makeProps({ executionOrder: undefined }),
    );

    expect(command.projectId).toBe(PROJECT_ID);
    expect(command.title).toBe('Subir ambiente local');
    expect(command.command).toBe('docker compose up -d');
    expect(command.executionOrder).toBeUndefined();
  });

  it.each([
    ['projectId inválido', { projectId: 'project-1' }],
    ['título vazio', { title: '' }],
    ['título acima do limite', { title: 'a'.repeat(121) }],
    ['comando vazio', { command: '' }],
    ['ordem negativa', { executionOrder: -1 }],
    ['ordem fracionária', { executionOrder: 1.5 }],
  ])('rejeita %s', (_, overrides) => {
    expect(() => new ProjectCommandEntity(makeProps(overrides))).toThrow(
      EntityValidationError,
    );
  });

  it('valida os novos dados antes de alterar a entidade', () => {
    const command = new ProjectCommandEntity(makeProps());

    expect(() => command.update({ title: '' })).toThrow(EntityValidationError);
    expect(command.title).toBe('Subir ambiente local');
  });

  it('atualiza título, comando, descrição e ordem', () => {
    const command = new ProjectCommandEntity(makeProps());

    command.update({
      title: 'Parar ambiente local',
      command: 'docker compose down',
      description: 'Encerra os serviços do projeto',
      executionOrder: 1,
    });

    expect(command.title).toBe('Parar ambiente local');
    expect(command.command).toBe('docker compose down');
    expect(command.description).toBe('Encerra os serviços do projeto');
    expect(command.executionOrder).toBe(1);
  });
});

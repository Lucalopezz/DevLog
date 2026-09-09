import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import {
  ProjectCommandEntity,
  type ProjectCommandProps,
} from '../../project-command.entity';

const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174000';

function makeProps(
  overrides: Partial<ProjectCommandProps> = {},
): ProjectCommandProps {
  const date = new Date('2026-08-01T00:00:00.000Z');

  return {
    projectId: PROJECT_ID,
    title: 'Subir ambiente local',
    command: 'docker compose up -d',
    description: 'Start project services',
    executionOrder: 0,
    createdAt: date,
    updatedAt: date,
    ...overrides,
  };
}

describe('ProjectCommandEntity', () => {
  it('creates a command with optional execution order', () => {
    const command = new ProjectCommandEntity(
      makeProps({ executionOrder: undefined }),
    );

    expect(command.projectId).toBe(PROJECT_ID);
    expect(command.title).toBe('Subir ambiente local');
    expect(command.command).toBe('docker compose up -d');
    expect(command.executionOrder).toBeUndefined();
  });

  it.each([
    ['invalid projectId', { projectId: 'project-1' }],
    ['empty title', { title: '' }],
    ['title above the limit', { title: 'a'.repeat(121) }],
    ['empty command', { command: '' }],
    ['ordem negativa', { executionOrder: -1 }],
    ['fractional order', { executionOrder: 1.5 }],
  ])('rejects %s', (_, overrides) => {
    expect(() => new ProjectCommandEntity(makeProps(overrides))).toThrow(
      EntityValidationError,
    );
  });

  it('validates new data before changing the entity', () => {
    const command = new ProjectCommandEntity(makeProps());

    expect(() => command.update({ title: '' })).toThrow(EntityValidationError);
    expect(command.title).toBe('Subir ambiente local');
  });

  it('updates title, command, description, and order', () => {
    const command = new ProjectCommandEntity(makeProps());

    command.update({
      title: 'Parar ambiente local',
      command: 'docker compose down',
      description: 'Stop project services',
      executionOrder: 1,
    });

    expect(command.title).toBe('Parar ambiente local');
    expect(command.command).toBe('docker compose down');
    expect(command.description).toBe('Stop project services');
    expect(command.executionOrder).toBe(1);
  });

  it('clears description and order with null', () => {
    const command = new ProjectCommandEntity(makeProps());

    command.update({ description: null, executionOrder: null });

    expect(command.description).toBeUndefined();
    expect(command.executionOrder).toBeUndefined();
  });

  it('treats an update with no fields as a no-op and preserves updatedAt', () => {
    const command = new ProjectCommandEntity(makeProps());
    const originalUpdatedAt = command.updatedAt;

    expect(() => command.update({})).not.toThrow();
    expect(command.updatedAt).toEqual(originalUpdatedAt);
  });
});

import { ProjectEntity, type ProjectProps } from '../../project.entity';
import { ProjectStatusEnum } from '../../project-status-enum';
import { ProjectCommandEntity } from '../../../command/project-command.entity';
import { ProjectResourceEntity } from '../../../resource/project-resource.entity';
import { ProjectResourceType } from '../../../resource/project-resource-type.enum';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';

function makeProps(overrides: Partial<ProjectProps> = {}): ProjectProps {
  const date = new Date('2026-08-01T00:00:00.000Z');

  return {
    userId: USER_ID,
    name: 'DevLog',
    description: 'Study project',
    status: ProjectStatusEnum.ACTIVE,
    createdAt: date,
    updatedAt: date,
    ...overrides,
  };
}

describe('ProjectEntity', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('updates and clears optional fields through the same method', () => {
    const project = new ProjectEntity(makeProps());

    project.update({ localPath: '/workspace/devlog' });
    expect(project.localPath).toBe('/workspace/devlog');

    project.update({ description: null, localPath: null });
    expect(project.description).toBeUndefined();
    expect(project.localPath).toBeUndefined();
  });

  it('explicitly archives and restores the project', () => {
    jest.useFakeTimers();
    const archivedAt = new Date('2026-08-02T12:00:00.000Z');
    jest.setSystemTime(archivedAt);
    const project = new ProjectEntity(makeProps());

    project.archive();

    expect(project.status).toBe(ProjectStatusEnum.ACTIVE);
    expect(project.archivedAt).toEqual(archivedAt);
    expect(project.updatedAt).toEqual(archivedAt);

    const restoredAt = new Date('2026-08-03T12:00:00.000Z');
    jest.setSystemTime(restoredAt);
    project.restore();

    expect(project.status).toBe(ProjectStatusEnum.ACTIVE);
    expect(project.archivedAt).toBeUndefined();
    expect(project.updatedAt).toEqual(restoredAt);
  });

  it('updates name, description, status, and path while active', () => {
    const project = new ProjectEntity(makeProps());

    project.update({
      name: 'DevLog atualizado',
      description: 'New description',
      status: ProjectStatusEnum.FINISHED,
      localPath: '/workspace/devlog',
    });

    expect(project.name).toBe('DevLog atualizado');
    expect(project.description).toBe('New description');
    expect(project.status).toBe(ProjectStatusEnum.FINISHED);
    expect(project.localPath).toBe('/workspace/devlog');
  });

  it('keeps status independent and makes the aggregate read-only when archived', () => {
    const project = new ProjectEntity(
      makeProps({ status: ProjectStatusEnum.FINISHED }),
    );

    project.archive();

    expect(project.status).toBe(ProjectStatusEnum.FINISHED);
    expect(() => project.update({ status: ProjectStatusEnum.ACTIVE })).toThrow(
      EntityValidationError,
    );
    expect(() => project.addTechnology('NestJS')).toThrow(
      EntityValidationError,
    );
    expect(() => project.addCommand('Subir API', 'pnpm dev')).toThrow(
      EntityValidationError,
    );
    expect(() =>
      project.addResource(
        'Documentation',
        'https://example.com',
        ProjectResourceType.DOCUMENTATION,
      ),
    ).toThrow(EntityValidationError);

    project.restore();
    expect(() =>
      project.update({ status: ProjectStatusEnum.ACTIVE }),
    ).not.toThrow();
  });

  it('allows clearing the description during an update', () => {
    const project = new ProjectEntity(makeProps());

    project.update({ description: null });

    expect(project.description).toBeUndefined();

    project.update({ description: 'Description restaurada' });

    expect(project.description).toBe('Description restaurada');
  });

  it('keeps archive and restore idempotent', () => {
    jest.useFakeTimers();
    const archivedAt = new Date('2026-08-02T12:00:00.000Z');
    jest.setSystemTime(archivedAt);
    const project = new ProjectEntity(makeProps());

    project.archive();
    const firstUpdatedAt = project.updatedAt;

    jest.setSystemTime(new Date('2026-08-03T12:00:00.000Z'));
    project.archive();

    expect(project.archivedAt).toEqual(archivedAt);
    expect(project.updatedAt).toEqual(firstUpdatedAt);

    project.restore();
    const restoredAt = project.updatedAt;

    jest.setSystemTime(new Date('2026-08-04T12:00:00.000Z'));
    project.restore();

    expect(project.archivedAt).toBeUndefined();
    expect(project.updatedAt).toEqual(restoredAt);
  });

  it('treats an update with no fields as a no-op and preserves updatedAt', () => {
    const project = new ProjectEntity(makeProps());
    const originalUpdatedAt = project.updatedAt;

    expect(() => project.update({})).not.toThrow();
    expect(project.updatedAt).toEqual(originalUpdatedAt);
  });

  it('creates a command linked to its own project', () => {
    const project = new ProjectEntity(makeProps());

    const command = project.addCommand(
      'Subir ambiente local',
      'docker compose up -d',
      'Start services',
      1,
    );

    expect(command).toBeInstanceOf(ProjectCommandEntity);
    expect(command.projectId).toBe(project.id);
    expect(command.title).toBe('Subir ambiente local');
    expect(command.command).toBe('docker compose up -d');
    expect(command.description).toBe('Start services');
    expect(command.executionOrder).toBe(1);
  });

  it('creates a resource linked to its own project', () => {
    const project = new ProjectEntity(makeProps());

    const resource = project.addResource(
      'Repository principal',
      'https://github.com/example/devlog',
      ProjectResourceType.REPOSITORY,
    );

    expect(resource).toBeInstanceOf(ProjectResourceEntity);
    expect(resource.projectId).toBe(project.id);
    expect(resource.label).toBe('Repository principal');
    expect(resource.url).toBe('https://github.com/example/devlog');
    expect(resource.type).toBe(ProjectResourceType.REPOSITORY);
  });
});

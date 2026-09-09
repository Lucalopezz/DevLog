import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { ProjectResourceType } from '../../project-resource-type.enum';
import {
  ProjectResourceEntity,
  type ProjectResourceProps,
} from '../../project-resource.entity';

const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174000';

function makeProps(
  overrides: Partial<ProjectResourceProps> = {},
): ProjectResourceProps {
  const date = new Date('2026-08-01T00:00:00.000Z');

  return {
    projectId: PROJECT_ID,
    label: 'Repository principal',
    url: 'https://github.com/example/devlog',
    type: ProjectResourceType.REPOSITORY,
    createdAt: date,
    updatedAt: date,
    ...overrides,
  };
}

describe('ProjectResourceEntity', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a resource with valid data', () => {
    const resource = new ProjectResourceEntity(makeProps());

    expect(resource.projectId).toBe(PROJECT_ID);
    expect(resource.label).toBe('Repository principal');
    expect(resource.url).toBe('https://github.com/example/devlog');
    expect(resource.type).toBe(ProjectResourceType.REPOSITORY);
  });

  it.each([
    ['invalid projectId', { projectId: 'project-1' }],
    ['empty label', { label: '' }],
    ['label above the limit', { label: 'a'.repeat(121) }],
    ['URL vazia', { url: '' }],
    ['Invalid URL', { url: 'not-a-url' }],
    ['invalid type', { type: 'UNKNOWN' as ProjectResourceType }],
  ])('rejects %s', (_, overrides) => {
    expect(() => new ProjectResourceEntity(makeProps(overrides))).toThrow(
      EntityValidationError,
    );
  });

  it('accepts a local URL', () => {
    expect(
      () =>
        new ProjectResourceEntity(
          makeProps({
            url: 'http://localhost:3000/docs',
            type: ProjectResourceType.LOCAL_URL,
          }),
        ),
    ).not.toThrow();
  });

  it('updates label, URL, and type', () => {
    jest.useFakeTimers();
    const updatedAt = new Date('2026-08-02T12:00:00.000Z');
    jest.setSystemTime(updatedAt);
    const resource = new ProjectResourceEntity(makeProps());

    resource.update({
      label: 'Documentation da API',
      url: 'https://docs.example.com/devlog',
      type: ProjectResourceType.DOCUMENTATION,
    });

    expect(resource.projectId).toBe(PROJECT_ID);
    expect(resource.label).toBe('Documentation da API');
    expect(resource.url).toBe('https://docs.example.com/devlog');
    expect(resource.type).toBe(ProjectResourceType.DOCUMENTATION);
    expect(resource.createdAt).toEqual(new Date('2026-08-01T00:00:00.000Z'));
    expect(resource.updatedAt).toEqual(updatedAt);
  });

  it('validates new data before changing the entity', () => {
    const resource = new ProjectResourceEntity(makeProps());
    const originalUpdatedAt = resource.updatedAt;

    expect(() => resource.update({ url: 'not-a-url' })).toThrow(
      EntityValidationError,
    );
    expect(resource.url).toBe('https://github.com/example/devlog');
    expect(resource.updatedAt).toBe(originalUpdatedAt);
  });

  it('treats an update with no fields as a no-op and preserves updatedAt', () => {
    const resource = new ProjectResourceEntity(makeProps());
    const originalUpdatedAt = resource.updatedAt;

    expect(() => resource.update({})).not.toThrow();
    expect(resource.updatedAt).toEqual(originalUpdatedAt);
  });
});

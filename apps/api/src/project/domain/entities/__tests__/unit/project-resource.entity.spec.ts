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
    label: 'Repositório principal',
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

  it('cria um recurso com os dados válidos', () => {
    const resource = new ProjectResourceEntity(makeProps());

    expect(resource.projectId).toBe(PROJECT_ID);
    expect(resource.label).toBe('Repositório principal');
    expect(resource.url).toBe('https://github.com/example/devlog');
    expect(resource.type).toBe(ProjectResourceType.REPOSITORY);
  });

  it.each([
    ['projectId inválido', { projectId: 'project-1' }],
    ['rótulo vazio', { label: '' }],
    ['rótulo acima do limite', { label: 'a'.repeat(121) }],
    ['URL vazia', { url: '' }],
    ['URL inválida', { url: 'not-a-url' }],
    ['tipo inválido', { type: 'UNKNOWN' as ProjectResourceType }],
  ])('rejeita %s', (_, overrides) => {
    expect(() => new ProjectResourceEntity(makeProps(overrides))).toThrow(
      EntityValidationError,
    );
  });

  it('aceita uma URL local', () => {
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

  it('atualiza rótulo, URL e tipo', () => {
    jest.useFakeTimers();
    const updatedAt = new Date('2026-08-02T12:00:00.000Z');
    jest.setSystemTime(updatedAt);
    const resource = new ProjectResourceEntity(makeProps());

    resource.update({
      label: 'Documentação da API',
      url: 'https://docs.example.com/devlog',
      type: ProjectResourceType.DOCUMENTATION,
    });

    expect(resource.projectId).toBe(PROJECT_ID);
    expect(resource.label).toBe('Documentação da API');
    expect(resource.url).toBe('https://docs.example.com/devlog');
    expect(resource.type).toBe(ProjectResourceType.DOCUMENTATION);
    expect(resource.createdAt).toEqual(new Date('2026-08-01T00:00:00.000Z'));
    expect(resource.updatedAt).toEqual(updatedAt);
  });

  it('valida os novos dados antes de alterar a entidade', () => {
    const resource = new ProjectResourceEntity(makeProps());
    const originalUpdatedAt = resource.updatedAt;

    expect(() => resource.update({ url: 'not-a-url' })).toThrow(
      EntityValidationError,
    );
    expect(resource.url).toBe('https://github.com/example/devlog');
    expect(resource.updatedAt).toBe(originalUpdatedAt);
  });

  it('trata atualização sem campos como no-op e preserva updatedAt', () => {
    const resource = new ProjectResourceEntity(makeProps());
    const originalUpdatedAt = resource.updatedAt;

    expect(() => resource.update({})).not.toThrow();
    expect(resource.updatedAt).toEqual(originalUpdatedAt);
  });
});

import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import {
  ProjectTechnologyEntity,
  type ProjectTechnologyProps,
} from '../project-technology.entity';

const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174000';

function makeProps(
  overrides: Partial<ProjectTechnologyProps> = {},
): ProjectTechnologyProps {
  const date = new Date('2026-08-01T00:00:00.000Z');

  return {
    projectId: PROJECT_ID,
    name: 'NestJS',
    version: '11',
    createdAt: date,
    updatedAt: date,
    ...overrides,
  };
}

describe('ProjectTechnologyEntity', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('cria uma tecnologia com versão opcional', () => {
    const technology = new ProjectTechnologyEntity(
      makeProps({ version: undefined }),
    );

    expect(technology.projectId).toBe(PROJECT_ID);
    expect(technology.name).toBe('NestJS');
    expect(technology.version).toBeUndefined();
    expect(technology.createdAt).toEqual(new Date('2026-08-01T00:00:00.000Z'));
    expect(technology.updatedAt).toEqual(new Date('2026-08-01T00:00:00.000Z'));
  });

  it.each([
    ['projectId inválido', { projectId: 'project-1' }],
    ['nome vazio', { name: '' }],
    ['nome acima do limite', { name: 'a'.repeat(101) }],
    ['versão acima do limite', { version: 'a'.repeat(51) }],
  ])('rejeita %s', (_, overrides) => {
    expect(() => new ProjectTechnologyEntity(makeProps(overrides))).toThrow(
      EntityValidationError,
    );
  });

  it('aceita os limites máximos de nome e versão', () => {
    expect(
      () =>
        new ProjectTechnologyEntity(
          makeProps({ name: 'a'.repeat(100), version: 'a'.repeat(50) }),
        ),
    ).not.toThrow();
  });
});

import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { ProjectEnvironmentEntity } from '../../project-environment.entity';
import { ProjectEnvironmentCategory } from '../../project-environment-category.enum';

const projectId = '98e94a80-df63-46ef-aa35-f9f36f7c44b6';

describe('ProjectEnvironmentEntity', () => {
  it('trims display fields and normalizes the name for uniqueness', () => {
    const environment = new ProjectEnvironmentEntity({
      projectId,
      name: '  Local Development  ',
      category: ProjectEnvironmentCategory.LOCAL,
      operatingSystem: '  Ubuntu 24.04  ',
      runtime: '  Node.js  ',
    });

    expect(environment.name).toBe('Local Development');
    expect(environment.normalizedName).toBe('local development');
    expect(environment.operatingSystem).toBe('Ubuntu 24.04');
    expect(environment.runtime).toBe('Node.js');
  });

  it.each([' ', 'a', 'a'.repeat(101)])(
    'rejects an invalid name: %s',
    (name) => {
      expect(
        () =>
          new ProjectEnvironmentEntity({
            projectId,
            name,
            category: ProjectEnvironmentCategory.LOCAL,
          }),
      ).toThrow(EntityValidationError);
    },
  );

  it('rejects an unsupported category and oversized optional fields', () => {
    expect(
      () =>
        new ProjectEnvironmentEntity({
          projectId,
          name: 'Local',
          category: 'INVALID' as ProjectEnvironmentCategory,
        }),
    ).toThrow(EntityValidationError);
    expect(
      () =>
        new ProjectEnvironmentEntity({
          projectId,
          name: 'Local',
          category: ProjectEnvironmentCategory.LOCAL,
          runtimeVersion: 'x'.repeat(51),
        }),
    ).toThrow(EntityValidationError);
  });

  it('preserves omitted values, clears null, and changes updatedAt only for a real change', () => {
    const environment = new ProjectEnvironmentEntity({
      projectId,
      name: 'Local',
      category: ProjectEnvironmentCategory.LOCAL,
      runtime: 'Node.js',
    });
    const initialUpdate = environment.updatedAt;
    environment.update({});
    environment.update({ name: ' Local ' });
    expect(environment.updatedAt).toBe(initialUpdate);
    environment.update({
      runtime: null,
      category: ProjectEnvironmentCategory.TESTING,
    });
    expect(environment.runtime).toBeUndefined();
    expect(environment.category).toBe(ProjectEnvironmentCategory.TESTING);
    expect(environment.name).toBe('Local');
    expect(environment.updatedAt).not.toBe(initialUpdate);
  });
});

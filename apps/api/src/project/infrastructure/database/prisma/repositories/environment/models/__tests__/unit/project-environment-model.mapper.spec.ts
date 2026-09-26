import { ProjectEnvironmentCategory } from '@/project/domain/entities/environment/project-environment-category.enum';
import { ProjectEnvironmentEntity } from '@/project/domain/entities/environment/project-environment.entity';
import { ProjectEnvironmentModelMapper } from '../../project-environment-model.mapper';

const projectId = '123e4567-e89b-42d3-a456-426614174002';
describe('ProjectEnvironmentModelMapper', () => {
  it('round trips every persisted field', () => {
    const entity = new ProjectEnvironmentEntity({
      projectId,
      name: 'Production',
      category: ProjectEnvironmentCategory.PRODUCTION,
      operatingSystem: 'Ubuntu',
      runtime: 'Node.js',
      runtimeVersion: '22',
      description: 'Managed runtime',
    });
    const persisted = ProjectEnvironmentModelMapper.toPersistence(entity);
    const loaded = ProjectEnvironmentModelMapper.toEntity(persisted);
    expect(loaded.toJSON()).toEqual(entity.toJSON());
    expect(persisted.normalizedName).toBe('production');
  });
});

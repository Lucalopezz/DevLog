import { ProjectEnvironmentEntity } from '@/project/domain/entities/environment/project-environment.entity';
import { ProjectEnvironmentCategory } from '@/project/domain/entities/environment/project-environment-category.enum';

export type ProjectEnvironmentOutput = {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  category: ProjectEnvironmentCategory;
  operatingSystem: string | null;
  runtime: string | null;
  runtimeVersion: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class ProjectEnvironmentOutputMapper {
  static toOutput(
    entity: ProjectEnvironmentEntity,
    projectName: string,
  ): ProjectEnvironmentOutput {
    return {
      id: entity.id,
      projectId: entity.projectId,
      projectName,
      name: entity.name,
      category: entity.category,
      operatingSystem: entity.operatingSystem ?? null,
      runtime: entity.runtime ?? null,
      runtimeVersion: entity.runtimeVersion ?? null,
      description: entity.description ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

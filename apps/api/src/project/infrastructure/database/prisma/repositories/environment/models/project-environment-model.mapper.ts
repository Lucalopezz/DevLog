import { ProjectEnvironmentEntity } from '@/project/domain/entities/environment/project-environment.entity';
import { ProjectEnvironmentCategory } from '@/project/domain/entities/environment/project-environment-category.enum';
import { ValidationError } from '@/shared/domain/errors/validation-error';
import {
  ProjectEnvironment,
  ProjectEnvironmentCategory as PrismaEnvironmentCategory,
} from '@generated/prisma/client';

export class ProjectEnvironmentModelMapper {
  static toEntity(model: ProjectEnvironment): ProjectEnvironmentEntity {
    try {
      return new ProjectEnvironmentEntity(
        {
          projectId: model.projectId,
          name: model.name,
          category: ProjectEnvironmentCategory[model.category],
          operatingSystem: model.operatingSystem ?? undefined,
          runtime: model.runtime ?? undefined,
          runtimeVersion: model.runtimeVersion ?? undefined,
          description: model.description ?? undefined,
          createdAt: model.createdAt,
          updatedAt: model.updatedAt,
        },
        model.id,
      );
    } catch {
      throw new ValidationError('An entity could not be loaded');
    }
  }

  static toPersistence(entity: ProjectEnvironmentEntity) {
    return {
      id: entity.id,
      projectId: entity.projectId,
      name: entity.name,
      normalizedName: entity.normalizedName,
      category: PrismaEnvironmentCategory[entity.category],
      operatingSystem: entity.operatingSystem ?? null,
      runtime: entity.runtime ?? null,
      runtimeVersion: entity.runtimeVersion ?? null,
      description: entity.description ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

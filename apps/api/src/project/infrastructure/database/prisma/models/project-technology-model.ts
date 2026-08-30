import { ProjectTechnologyEntity } from '@/project/domain/entities/project-technology.entity';
import { ValidationError } from '@/shared/domain/errors/validation-error';
import type { ProjectTechnology } from '@generated/prisma/client';

export class ProjectTechnologyModelMapper {
  static toEntity(model: ProjectTechnology): ProjectTechnologyEntity {
    const data = {
      projectId: model.projectId,
      name: model.name,
      version: model.version ?? undefined,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };

    try {
      return new ProjectTechnologyEntity(data, model.id);
    } catch {
      throw new ValidationError('An entity not be loaded');
    }
  }

  static toPersistence(entity: ProjectTechnologyEntity) {
    return {
      id: entity.id,
      projectId: entity.projectId,
      name: entity.name,
      version: entity.version ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

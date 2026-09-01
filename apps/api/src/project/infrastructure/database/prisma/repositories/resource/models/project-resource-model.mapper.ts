import { ProjectResourceType } from '@/project/domain/entities/resource/project-resource-type.enum';
import { ProjectResourceEntity } from '@/project/domain/entities/resource/project-resource.entity';
import { ValidationError } from '@/shared/domain/errors/validation-error';
import {
  type ProjectResource,
  ProjectResourceType as PrismaProjectResourceType,
} from '@generated/prisma/client';

export class ProjectResourceModelMapper {
  static toEntity(model: ProjectResource): ProjectResourceEntity {
    const data = {
      projectId: model.projectId,
      label: model.label,
      url: model.url,
      type: this.toDomainType(model.type),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };

    try {
      return new ProjectResourceEntity(data, model.id);
    } catch {
      throw new ValidationError('An entity not be loaded');
    }
  }

  static toPersistence(entity: ProjectResourceEntity) {
    return {
      id: entity.id,
      projectId: entity.projectId,
      label: entity.label,
      url: entity.url,
      type: this.toPrismaType(entity.type),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private static toDomainType(
    type: PrismaProjectResourceType,
  ): ProjectResourceType {
    switch (type) {
      case PrismaProjectResourceType.REPOSITORY:
        return ProjectResourceType.REPOSITORY;
      case PrismaProjectResourceType.DOCUMENTATION:
        return ProjectResourceType.DOCUMENTATION;
      case PrismaProjectResourceType.LOCAL_URL:
        return ProjectResourceType.LOCAL_URL;
      case PrismaProjectResourceType.EXTERNAL_URL:
        return ProjectResourceType.EXTERNAL_URL;
      case PrismaProjectResourceType.OTHER:
        return ProjectResourceType.OTHER;
      default:
        throw new ValidationError('Invalid project resource type');
    }
  }

  static toPrismaType(type: ProjectResourceType): PrismaProjectResourceType {
    switch (type) {
      case ProjectResourceType.REPOSITORY:
        return PrismaProjectResourceType.REPOSITORY;
      case ProjectResourceType.DOCUMENTATION:
        return PrismaProjectResourceType.DOCUMENTATION;
      case ProjectResourceType.LOCAL_URL:
        return PrismaProjectResourceType.LOCAL_URL;
      case ProjectResourceType.EXTERNAL_URL:
        return PrismaProjectResourceType.EXTERNAL_URL;
      case ProjectResourceType.OTHER:
        return PrismaProjectResourceType.OTHER;
      default:
        throw new ValidationError('Invalid project resource type');
    }
  }
}

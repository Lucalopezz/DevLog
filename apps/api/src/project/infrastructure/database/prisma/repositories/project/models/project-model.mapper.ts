import { ValidationError } from '@/shared/domain/errors/validation-error';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import {
  ProjectStatus as PrismaProjectStatus,
  type Project,
} from '@generated/prisma/client';

export class ProjectModelMapper {
  static toEntity(model: Project): ProjectEntity {
    const data = {
      userId: model.userId,
      name: model.name,
      description: model.description ?? undefined,
      status: this.toDomainStatus(model.status),
      localPath: model.localPath ?? undefined,
      archivedAt: model.archivedAt ?? undefined,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };

    try {
      return new ProjectEntity(data, model.id);
    } catch {
      throw new ValidationError('An entity not be loaded');
    }
  }

  static toPersistence(entity: ProjectEntity) {
    return {
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      description: entity.description,
      status: this.toPrismaStatus(entity.status),
      localPath: entity.localPath ?? null,
      archivedAt: entity.archivedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private static toDomainStatus(
    status: PrismaProjectStatus | null,
  ): ProjectStatusEnum {
    switch (status) {
      case PrismaProjectStatus.ACTIVE:
        return ProjectStatusEnum.ACTIVE;
      case PrismaProjectStatus.PAUSED:
        return ProjectStatusEnum.INACTIVE;
      case PrismaProjectStatus.FINISHED:
        return ProjectStatusEnum.FINISHED;
      default:
        throw new ValidationError('Invalid project status');
    }
  }

  static toPrismaStatus(status: ProjectStatusEnum): PrismaProjectStatus {
    switch (status) {
      case ProjectStatusEnum.ACTIVE:
        return PrismaProjectStatus.ACTIVE;
      case ProjectStatusEnum.INACTIVE:
        return PrismaProjectStatus.PAUSED;
      case ProjectStatusEnum.FINISHED:
        return PrismaProjectStatus.FINISHED;
      default:
        throw new ValidationError('Invalid project status');
    }
  }
}

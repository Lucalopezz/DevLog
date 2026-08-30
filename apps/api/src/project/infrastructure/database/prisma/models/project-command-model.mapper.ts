import { ProjectCommandEntity } from '@/project/domain/entities/project-command.entity';
import { ValidationError } from '@/shared/domain/errors/validation-error';
import { ProjectCommand } from '@generated/prisma/client';

export class ProjectCommandModelMapper {
  static toEntity(model: ProjectCommand): ProjectCommandEntity {
    const data = {
      projectId: model.projectId,
      title: model.title,
      command: model.command,
      description: model.description ?? undefined,
      executionOrder: model.executionOrder ?? undefined,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };

    try {
      return new ProjectCommandEntity(data, model.id);
    } catch {
      throw new ValidationError('An entity not be loaded');
    }
  }

  static toPersistence(entity: ProjectCommandEntity) {
    return {
      id: entity.id,
      projectId: entity.projectId,
      title: entity.title,
      command: entity.command,
      // permite que o Prisma receba null ao persistir campos opcionais
      description: entity.description ?? null,
      executionOrder: entity.executionOrder ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

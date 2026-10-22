import { ProjectTodo } from '@generated/prisma/client';
import { ProjectTodoEntity } from '@/project/domain/entities/todo/project-todo.entity';

export class ProjectTodoModelMapper {
  static toEntity(model: ProjectTodo): ProjectTodoEntity {
    return new ProjectTodoEntity(
      {
        projectId: model.projectId,
        title: model.title,
        completedAt: model.completedAt ?? undefined,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      },
      model.id,
    );
  }

  static toPersistence(entity: ProjectTodoEntity) {
    return {
      id: entity.id,
      projectId: entity.projectId,
      title: entity.title,
      completedAt: entity.completedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

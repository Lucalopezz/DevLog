import { ProjectTodoEntity } from '@/project/domain/entities/todo/project-todo.entity';

export type ProjectTodoOutput = {
  id: string;
  projectId: string;
  title: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class ProjectTodoOutputMapper {
  static toOutput(entity: ProjectTodoEntity): ProjectTodoOutput {
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

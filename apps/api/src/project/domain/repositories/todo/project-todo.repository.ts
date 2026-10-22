import { ProjectTodoEntity } from '../../entities/todo/project-todo.entity';

export type ProjectTodoPage = {
  items: ProjectTodoEntity[];
  total: number;
  currentPage: number;
  perPage: number;
  lastPage: number;
};

export interface ProjectTodoRepository {
  insert(entity: ProjectTodoEntity): Promise<void>;
  update(entity: ProjectTodoEntity): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<ProjectTodoEntity | null>;
  search(
    projectId: string,
    page: number,
    perPage: number,
  ): Promise<ProjectTodoPage>;
}

import { ProjectTodoOutput } from '@/project/application/dto/todo/project-todo.dto';
import { PaginationOutput } from '@/shared/application/dtos/pagination-output';
import { CollectionPresenter } from '@/shared/infrastructure/presenter/collection.presenter';

export class ProjectTodoPresenter {
  id: string;
  projectId: string;
  title: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(output: ProjectTodoOutput) {
    Object.assign(this, output);
  }
}

export class ProjectTodoCollectionPresenter extends CollectionPresenter<ProjectTodoPresenter> {
  data: ProjectTodoPresenter[];
  constructor(output: PaginationOutput<ProjectTodoOutput>) {
    const { items, ...pagination } = output;
    super(pagination);
    this.data = items.map((item) => new ProjectTodoPresenter(item));
  }
}

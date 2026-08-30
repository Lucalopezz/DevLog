import type { ProjectCommandOutput } from '@/project/application/dto/project-command.dto';
import type { SearchProjectCommandUseCaseOutput } from '@/project/application/usecases/search-project-command.usecase';
import { CollectionPresenter } from '@/shared/infrastructure/presenter/collection.presenter';

export class ProjectCommandPresenter {
  id: string;
  projectId: string;
  title: string;
  command: string;
  description?: string;
  executionOrder?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(output: ProjectCommandOutput) {
    this.id = output.id;
    this.projectId = output.projectId;
    this.title = output.title;
    this.command = output.command;
    this.description = output.description;
    this.executionOrder = output.executionOrder;
    this.createdAt = output.createdAt;
    this.updatedAt = output.updatedAt;
  }
}

export class ProjectCommandCollectionPresenter extends CollectionPresenter<ProjectCommandPresenter> {
  data: ProjectCommandPresenter[];

  constructor(output: SearchProjectCommandUseCaseOutput) {
    const { items, ...paginationProps } = output;
    super(paginationProps);
    this.data = items.map((item) => new ProjectCommandPresenter(item));
  }
}

import type { ProjectTechnologyListItem } from '@/project/domain/repositories/technology/project-technology.repository';
import type { SearchProjectTechnologyUseCaseOutput } from '@/project/application/usecases/technology/search-project-technology.usecase';
import { CollectionPresenter } from '@/shared/infrastructure/presenter/collection.presenter';

export class ProjectTechnologyPresenter {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  version?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(item: ProjectTechnologyListItem) {
    this.id = item.id;
    this.projectId = item.projectId;
    this.projectName = item.projectName;
    this.name = item.name;
    this.version = item.version;
    this.createdAt = item.createdAt;
    this.updatedAt = item.updatedAt;
  }
}

export class ProjectTechnologyCollectionPresenter extends CollectionPresenter<ProjectTechnologyPresenter> {
  data: ProjectTechnologyPresenter[];

  constructor(output: SearchProjectTechnologyUseCaseOutput) {
    const { items, ...paginationProps } = output;
    super(paginationProps);
    this.data = items.map((item) => new ProjectTechnologyPresenter(item));
  }
}

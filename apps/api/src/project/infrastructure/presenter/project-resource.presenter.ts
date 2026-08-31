import type { ProjectResourceOutput } from '@/project/application/dto/project-resource.dto';
import type { SearchProjectResourceUseCaseOutput } from '@/project/application/usecases/search-project-resource.usecase';
import { ProjectResourceType } from '@/project/domain/entities/project-resource-type.enum';
import { CollectionPresenter } from '@/shared/infrastructure/presenter/collection.presenter';

export class ProjectResourcePresenter {
  id: string;
  projectId: string;
  label: string;
  url: string;
  type: ProjectResourceType;
  createdAt: Date;
  updatedAt: Date;

  constructor(output: ProjectResourceOutput) {
    this.id = output.id;
    this.projectId = output.projectId;
    this.label = output.label;
    this.url = output.url;
    this.type = output.type;
    this.createdAt = output.createdAt;
    this.updatedAt = output.updatedAt;
  }
}

export class ProjectResourceCollectionPresenter extends CollectionPresenter<ProjectResourcePresenter> {
  data: ProjectResourcePresenter[];

  constructor(output: SearchProjectResourceUseCaseOutput) {
    const { items, ...paginationProps } = output;
    super(paginationProps);
    this.data = items.map((item) => new ProjectResourcePresenter(item));
  }
}

import { ProjectEnvironmentOutput } from '@/project/application/dto/environment/project-environment.dto';
import { CollectionPresenter } from '@/shared/infrastructure/presenter/collection.presenter';
import { PaginationOutput } from '@/shared/application/dtos/pagination-output';

export class ProjectEnvironmentPresenter {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  category: string;
  operatingSystem: string | null;
  runtime: string | null;
  runtimeVersion: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(output: ProjectEnvironmentOutput) {
    Object.assign(this, output);
  }
}

export class ProjectEnvironmentCollectionPresenter extends CollectionPresenter<ProjectEnvironmentPresenter> {
  data: ProjectEnvironmentPresenter[];
  constructor(output: PaginationOutput<ProjectEnvironmentOutput>) {
    const { items, ...pagination } = output;
    super(pagination);
    this.data = items.map((item) => new ProjectEnvironmentPresenter(item));
  }
}

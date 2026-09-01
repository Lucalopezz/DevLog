import { CollectionPresenter } from '@/shared/infrastructure/presenter/collection.presenter';
import {
  ProjectOutput,
  ProjectTechnologyOutput,
} from '@/project/application/dto/project/project.dto';
import { SearchProjectUseCaseOutput } from '@/project/application/usecases/project/search-project.usecase';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';

export class ProjectPresenter {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatusEnum;
  technologies?: ProjectTechnologyOutput[];
  localPath?: string;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(output: ProjectOutput) {
    this.id = output.id;
    this.name = output.name;
    this.description = output.description;
    this.status = output.status;
    this.technologies = output.technologies;
    this.localPath = output.localPath;
    this.archivedAt = output.archivedAt;
    this.createdAt = output.createdAt;
    this.updatedAt = output.updatedAt;
  }
}

export class ProjectCollectionPresenter extends CollectionPresenter<ProjectPresenter> {
  data: ProjectPresenter[];

  constructor(output: SearchProjectUseCaseOutput) {
    const { items, ...paginationProps } = output;
    super(paginationProps);
    this.data = items.map((item) => new ProjectPresenter(item));
  }
}

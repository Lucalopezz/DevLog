import {
  SearchableRepositoryInterface,
  SearchParams,
  SearchResult,
} from '@/shared/domain/repositories/searchable.repository';
import { ProjectStatusEnum } from '../entities/project-status-enum';
import { ProjectEntity } from '../entities/project.entity';

export type ProjectFilter = {
  userId?: string;
  title?: string;
  archivedAt?: Date | null;
  status?: ProjectStatusEnum;
};

export class ProjectSearchParams extends SearchParams<ProjectFilter> {}

export class ProjectSearchResult extends SearchResult<
  ProjectEntity,
  ProjectFilter
> {}

export interface ProjectRepository extends SearchableRepositoryInterface<
  ProjectEntity,
  ProjectFilter,
  ProjectSearchParams,
  ProjectSearchResult
> {
  findByOwnerId(userId: string): Promise<ProjectEntity[]>;
}

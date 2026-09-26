import {
  SearchableRepositoryInterface,
  SearchParams,
  SearchResult,
} from '@/shared/domain/repositories/searchable.repository';
import { ProjectEnvironmentEntity } from '../../entities/environment/project-environment.entity';
import { ProjectEnvironmentCategory } from '../../entities/environment/project-environment-category.enum';

export type ProjectEnvironmentFilter = {
  projectId?: string;
  userId?: string;
  search?: string;
  category?: ProjectEnvironmentCategory;
};
export class ProjectEnvironmentSearchParams extends SearchParams<ProjectEnvironmentFilter> {}
export class ProjectEnvironmentSearchResult extends SearchResult<
  ProjectEnvironmentEntity,
  ProjectEnvironmentFilter
> {}

export interface ProjectEnvironmentRepository extends SearchableRepositoryInterface<
  ProjectEnvironmentEntity,
  ProjectEnvironmentFilter,
  ProjectEnvironmentSearchParams,
  ProjectEnvironmentSearchResult
> {
  findByNormalizedName(
    projectId: string,
    normalizedName: string,
  ): Promise<ProjectEnvironmentEntity | null>;
}

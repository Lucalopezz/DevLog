import {
  SearchableRepositoryInterface,
  SearchParams,
  SearchResult,
} from '@/shared/domain/repositories/searchable.repository';
import { ProjectResourceEntity } from '../../entities/resource/project-resource.entity';
import { ProjectResourceType } from '../../entities/resource/project-resource-type.enum';

export type ProjectResourceFilter = {
  projectId: string;
  label?: string;
  url?: string;
  type?: ProjectResourceType;
};

export class ProjectResourceSearchParams extends SearchParams<ProjectResourceFilter> {}

export class ProjectResourceSearchResult extends SearchResult<
  ProjectResourceEntity,
  ProjectResourceFilter
> {}

export type ProjectResourceRepository = SearchableRepositoryInterface<
  ProjectResourceEntity,
  ProjectResourceFilter,
  ProjectResourceSearchParams,
  ProjectResourceSearchResult
>;

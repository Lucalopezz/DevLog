import {
  SearchableRepositoryInterface,
  SearchParams,
  SearchResult,
} from '@/shared/domain/repositories/searchable.repository';
import { ProjectCommandEntity } from '../entities/project-command.entity';

export type ProjectCommandFilter = {
  projectId: string;
  title?: string;
  command?: string;
  description?: string;
};

export class ProjectCommandSearchParams extends SearchParams<ProjectCommandFilter> {}

export class ProjectCommandSearchResult extends SearchResult<
  ProjectCommandEntity,
  ProjectCommandFilter
> {}

export interface ProjectCommandRepository extends SearchableRepositoryInterface<
  ProjectCommandEntity,
  ProjectCommandFilter,
  ProjectCommandSearchParams,
  ProjectCommandSearchResult
> {}

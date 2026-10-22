import {
  SearchableRepositoryInterface,
  SearchParams,
  SearchResult,
} from '@/shared/domain/repositories/searchable.repository';
import { ProjectTodoEntity } from '../../entities/todo/project-todo.entity';

export type ProjectTodoFilter = { projectId: string };

export class ProjectTodoSearchParams extends SearchParams<ProjectTodoFilter> {}

export class ProjectTodoSearchResult extends SearchResult<
  ProjectTodoEntity,
  ProjectTodoFilter
> {}

export type ProjectTodoRepository = SearchableRepositoryInterface<
  ProjectTodoEntity,
  ProjectTodoFilter,
  ProjectTodoSearchParams,
  ProjectTodoSearchResult
>;

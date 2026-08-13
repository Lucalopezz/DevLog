import {
  SearchableRepositoryInterface,
  SearchParams,
  SearchResult,
} from '@/shared/domain/repositories/searchable.repository';
import { TagEntity } from '../entities/tag.entity';

export type TagFilter = {
  userId: string;
  name?: string;
};

export class TagSearchParams extends SearchParams<TagFilter> {}

export class TagSearchResult extends SearchResult<TagEntity, TagFilter> {}

export interface TagRepository extends SearchableRepositoryInterface<
  TagEntity,
  TagFilter,
  TagSearchParams,
  TagSearchResult
> {
  findByNormalizedName(
    normalizedName: string,
    userId: string,
  ): Promise<TagEntity | null>;
}

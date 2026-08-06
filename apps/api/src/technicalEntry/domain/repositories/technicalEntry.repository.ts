import { TechnicalEntryEntity } from '../entities/technicalEntry.entity';
import { TechnicalEntryType } from '../entities/technical-entry-type.enum';
import {
  SearchableRepositoryInterface,
  SearchParams,
  SearchResult,
} from '@/shared/domain/repositories/searchable.repository';

export type TechnicalEntryFilter = {
  userId?: string;
  projectId?: string;
  title?: string;
  type?: TechnicalEntryType;
  archivedAt?: Date | null;
};

export type TechnicalEntrySearchParams = SearchParams<TechnicalEntryFilter>;

export type TechnicalEntrySearchResult = SearchResult<
  TechnicalEntryEntity,
  TechnicalEntryFilter
>;

export interface TechnicalEntryRepository extends SearchableRepositoryInterface<
  TechnicalEntryEntity,
  TechnicalEntryFilter,
  TechnicalEntrySearchParams,
  TechnicalEntrySearchResult
> {
  findByOwnerId(userId: string): Promise<TechnicalEntryEntity[]>;
}

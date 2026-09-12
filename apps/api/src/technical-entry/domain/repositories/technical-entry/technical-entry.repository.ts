import { TechnicalEntryEntity } from '../../entities/technical-entry/technical-entry.entity';
import { TechnicalEntryType } from '../../entities/technical-entry/technical-entry-type.enum';
import {
  SearchableRepositoryInterface,
  SearchParams,
  SearchResult,
} from '@/shared/domain/repositories/searchable.repository';
import { TechnicalEntryStatus } from '../../entities/technical-entry/technical-entry-status.enum';

/**
 * Search supports an exact date, no archive date, or any archive date.
 * `not-null` is a query-level sentinel for the last option.
 */
export type TechnicalEntryArchivedAtFilter = Date | null | 'not-null';

export type TechnicalEntryFilter = {
  userId?: string;
  projectId?: string;
  title?: string;
  type?: TechnicalEntryType;
  archivedAt?: TechnicalEntryArchivedAtFilter;
  status?: TechnicalEntryStatus;
};

export class TechnicalEntrySearchParams extends SearchParams<TechnicalEntryFilter> {}

export class TechnicalEntrySearchResult extends SearchResult<
  TechnicalEntryEntity,
  TechnicalEntryFilter
> {}

export interface TechnicalEntryRepository extends SearchableRepositoryInterface<
  TechnicalEntryEntity,
  TechnicalEntryFilter,
  TechnicalEntrySearchParams,
  TechnicalEntrySearchResult
> {
  findByOwnerId(userId: string): Promise<TechnicalEntryEntity[]>;
}

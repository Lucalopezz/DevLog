import { TechnicalEntryEntity } from '../entities/technical-entry.entity';
import { TechnicalEntryType } from '../entities/technical-entry-type.enum';
import {
  SearchableRepositoryInterface,
  SearchParams,
  SearchResult,
} from '@/shared/domain/repositories/searchable.repository';
import { TechnicalEntryStatus } from '../entities/technical-entry-status.enum';

export type TechnicalEntryFilter = {
  userId?: string;
  projectId?: string;
  title?: string;
  type?: TechnicalEntryType;
  archivedAt?: Date | null;
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

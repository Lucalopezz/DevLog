import type { SolutionAttemptResult } from '../../entities/solution-attempt/solution-attempt-result.enum';
import { SolutionAttemptEntity } from '../../entities/solution-attempt/solution-attempt.entity';
import {
  SearchableRepositoryInterface,
  SearchParams,
  SearchResult,
} from '@/shared/domain/repositories/searchable.repository';

export type SolutionAttemptFilter = {
  technicalEntryId?: string;
  result?: SolutionAttemptResult;
};

export class SolutionAttemptSearchParams extends SearchParams<SolutionAttemptFilter> {}

export class SolutionAttemptSearchResult extends SearchResult<
  SolutionAttemptEntity,
  SolutionAttemptFilter
> {}

export interface SolutionAttemptRepository extends SearchableRepositoryInterface<
  SolutionAttemptEntity,
  SolutionAttemptFilter,
  SolutionAttemptSearchParams,
  SolutionAttemptSearchResult
> {
  findByTechnicalEntryId(
    technicalEntryId: string,
  ): Promise<SolutionAttemptEntity[]>;
}

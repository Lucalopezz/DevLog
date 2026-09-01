import {
  PaginationOutput,
  PaginationOutputMapper,
} from '@/shared/application/dtos/pagination-output';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import {
  SolutionAttemptFilter,
  SolutionAttemptRepository,
  SolutionAttemptSearchParams,
  SolutionAttemptSearchResult,
} from '@/technical-entry/domain/repositories/solution-attempt/solution-attempt.repository';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';
import { SolutionAttemptResult } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt-result.enum';
import {
  SolutionAttemptOutput,
  SolutionAttemptOutputMapper,
} from '../../dto/solution-attempt/solution-attempt.dto';
import { NotFoundException } from '@nestjs/common';

export type ListSolutionAttemptsUseCaseInput = {
  userId: string;
  technicalEntryId: string;
  page?: number;
  perPage?: number;
  sort?: string;
  sortDir?: 'asc' | 'desc';
  // Filter
  result?: SolutionAttemptResult;
};

export type ListSolutionAttemptsUseCaseOutput =
  PaginationOutput<SolutionAttemptOutput>;

export class ListSolutionAttemptsUseCase implements UseCaseContract<
  ListSolutionAttemptsUseCaseInput,
  ListSolutionAttemptsUseCaseOutput
> {
  constructor(
    private readonly solutionAttemptRepository: SolutionAttemptRepository,
    private readonly technicalEntryRepository: TechnicalEntryRepository,
  ) {}
  async execute(
    input: ListSolutionAttemptsUseCaseInput,
  ): Promise<ListSolutionAttemptsUseCaseOutput> {
    const technicalEntry = await this.technicalEntryRepository.findById(
      input.technicalEntryId,
    );

    if (!technicalEntry || technicalEntry.userId !== input.userId) {
      throw new NotFoundException('Entrada técnica não encontrada');
    }

    const filter: SolutionAttemptFilter = {
      technicalEntryId: input.technicalEntryId,
    };

    if (input.result !== undefined) {
      filter.result = input.result;
    }

    const params = new SolutionAttemptSearchParams({
      page: input.page,
      perPage: input.perPage,
      sort: input.sort,
      sortDir: input.sortDir,
      filter,
    });

    const searchResult = await this.solutionAttemptRepository.search(params);

    return this.toOutput(searchResult);
  }

  private toOutput(
    result: SolutionAttemptSearchResult,
  ): ListSolutionAttemptsUseCaseOutput {
    const items = result.items.map((item) =>
      SolutionAttemptOutputMapper.toOutput(item),
    );

    return PaginationOutputMapper.toOutout(items, result);
  }
}

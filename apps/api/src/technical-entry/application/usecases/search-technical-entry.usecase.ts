import {
  PaginationOutput,
  PaginationOutputMapper,
} from '@/shared/application/dtos/pagination-output';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import {
  TechnicalEntryFilter,
  TechnicalEntryRepository,
  TechnicalEntrySearchParams,
  TechnicalEntrySearchResult,
} from '@/technical-entry/domain/repositories/technical-entry.repository';
import {
  TechnicalEntryOutput,
  TechnicalEntryOutputMapper,
} from '../dto/technical-entry.dto';
import { TechnicalEntryStatus } from '@/technical-entry/domain/entities/technical-entry-status.enum';
import { UnprocessableEntityException } from '@nestjs/common';

export type SearchTechnicalEntryUseCaseInput = {
  userId: string;
  page?: number;
  perPage?: number;
  sort?: string;
  sortDir?: 'asc' | 'desc';
  // Filter
  projectId?: string;
  title?: string;
  type?: TechnicalEntryType;
  archivedAt?: Date | null;
  status?: TechnicalEntryStatus;
};

export type SearchTechnicalEntryUseCaseOutput =
  PaginationOutput<TechnicalEntryOutput>;

export class SearchTechnicalEntryUseCase implements UseCaseContract<
  SearchTechnicalEntryUseCaseInput,
  SearchTechnicalEntryUseCaseOutput
> {
  constructor(
    private readonly technicalEntryRepository: TechnicalEntryRepository,
  ) {}

  async execute(
    input: SearchTechnicalEntryUseCaseInput,
  ): Promise<SearchTechnicalEntryUseCaseOutput> {
    // Valida se o tipo de entrada é LEARNING e se o status foi fornecido
    // As entradas do tipo LEARNING não possuem status, então se o status for fornecido para esse tipo,
    //  lançamos uma exceção
    if (
      input.type === TechnicalEntryType.LEARNING &&
      input.status !== undefined
    ) {
      throw new UnprocessableEntityException(
        'Entradas do tipo LEARNING não possuem status',
      );
    }

    const filter: TechnicalEntryFilter = { userId: input.userId };

    if (input.projectId) filter.projectId = input.projectId;
    if (input.title) filter.title = input.title;
    if (input.type) filter.type = input.type;
    if (input.status) filter.status = input.status;
    if (input.archivedAt !== undefined) filter.archivedAt = input.archivedAt;

    const params = new TechnicalEntrySearchParams({
      page: input.page,
      perPage: input.perPage,
      sort: input.sort,
      sortDir: input.sortDir,
      filter,
    });

    const result = await this.technicalEntryRepository.search(params);

    return this.toOutput(result);
  }

  private toOutput(
    result: TechnicalEntrySearchResult,
  ): SearchTechnicalEntryUseCaseOutput {
    const items = result.items.map((item) =>
      TechnicalEntryOutputMapper.toOutput(item),
    );

    return PaginationOutputMapper.toOutout(items, result);
  }
}

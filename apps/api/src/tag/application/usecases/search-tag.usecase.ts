import {
  PaginationOutput,
  PaginationOutputMapper,
} from '@/shared/application/dtos/pagination-output';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import {
  TagRepository,
  TagSearchParams,
  TagSearchResult,
} from '@/tag/domain/repositories/tag.repository';
import { TagOutput, TagOutputMapper } from '../dto/tag.dto';

export type SearchTagUseCaseInput = {
  userId: string;
  page?: number;
  perPage?: number;
  sort?: string;
  sortDir?: 'asc' | 'desc';
  name?: string;
};

export type SearchTagUseCaseOutput = PaginationOutput<TagOutput>;

export class SearchTagUseCase implements UseCaseContract<
  SearchTagUseCaseInput,
  SearchTagUseCaseOutput
> {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(input: SearchTagUseCaseInput): Promise<SearchTagUseCaseOutput> {
    const filter = {
      userId: input.userId,
      ...(input.name ? { name: input.name } : {}),
    };

    const params = new TagSearchParams({
      page: input.page,
      perPage: input.perPage,
      sort: input.sort,
      sortDir: input.sortDir,
      filter,
    });

    const result = await this.tagRepository.search(params);

    return this.toOutput(result);
  }

  private toOutput(result: TagSearchResult): SearchTagUseCaseOutput {
    const items = result.items.map((item) => TagOutputMapper.toOutput(item));

    return PaginationOutputMapper.toOutout(items, result);
  }
}

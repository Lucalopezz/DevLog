import {
  PaginationOutput,
  PaginationOutputMapper,
} from '@/shared/application/dtos/pagination-output';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { SearchInput } from '@/shared/application/dtos/search-input';
import {
  ProjectFilter,
  ProjectRepository,
  ProjectSearchParams,
  ProjectSearchResult,
} from '@/project/domain/repositories/project.repository';
import { ProjectOutput, ProjectOutputMapper } from '../dto/project.dto';

export type SearchProjectUseCaseInput = SearchInput<ProjectFilter>;

export type SearchProjectUseCaseOutput = PaginationOutput<ProjectOutput>;

export class SearchProjectUseCase implements UseCaseContract<
  SearchProjectUseCaseInput,
  SearchProjectUseCaseOutput
> {
  constructor(private readonly projectRepository: ProjectRepository) {}
  async execute(
    input: SearchProjectUseCaseInput,
  ): Promise<SearchProjectUseCaseOutput> {
    const params = new ProjectSearchParams(input);
    const result = await this.projectRepository.search(params);
    return this.toOutput(result);
  }

  private toOutput(result: ProjectSearchResult): SearchProjectUseCaseOutput {
    const items = result.items.map((item) =>
      ProjectOutputMapper.toOutput(item),
    );

    return PaginationOutputMapper.toOutout(items, result);
  }
}

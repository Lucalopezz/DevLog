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

export type SearchProjectUseCaseInput = Omit<
  SearchInput<ProjectFilter>,
  'filter'
> &
  Omit<ProjectFilter, 'userId'> & {
    userId: string;
  };

export type SearchProjectUseCaseOutput = PaginationOutput<ProjectOutput>;

export class SearchProjectUseCase implements UseCaseContract<
  SearchProjectUseCaseInput,
  SearchProjectUseCaseOutput
> {
  constructor(private readonly projectRepository: ProjectRepository) {}
  async execute(
    input: SearchProjectUseCaseInput,
  ): Promise<SearchProjectUseCaseOutput> {
    const { userId, name, archivedAt, status, ...searchProps } = input;

    const filter: ProjectFilter = { userId };

    if (name) filter.name = name;
    if (status) filter.status = status;
    if (archivedAt !== undefined) filter.archivedAt = archivedAt;

    const params = new ProjectSearchParams({
      ...searchProps,
      filter,
    });
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

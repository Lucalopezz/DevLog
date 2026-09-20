import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectTechnologyRepository } from '@/project/domain/repositories/technology/project-technology.repository';
import type { ProjectTechnologyListItem } from '@/project/domain/repositories/technology/project-technology.repository';

export type SearchProjectTechnologyUseCaseInput = {
  userId: string;
  name?: string;
  projectId?: string;
  page?: number;
  perPage?: number;
};

export type SearchProjectTechnologyUseCaseOutput = {
  items: ProjectTechnologyListItem[];
  total: number;
  currentPage: number;
  perPage: number;
  lastPage: number;
};

export class SearchProjectTechnologyUseCase implements UseCaseContract<
  SearchProjectTechnologyUseCaseInput,
  SearchProjectTechnologyUseCaseOutput
> {
  constructor(
    private readonly projectTechnologyRepository: ProjectTechnologyRepository,
  ) {}

  async execute(
    input: SearchProjectTechnologyUseCaseInput,
  ): Promise<SearchProjectTechnologyUseCaseOutput> {
    const currentPage = input.page ?? 1;
    const perPage = input.perPage ?? 15;
    const result = await this.projectTechnologyRepository.searchForOwner({
      userId: input.userId,
      name: input.name,
      projectId: input.projectId,
      page: currentPage,
      perPage,
    });

    return {
      items: result.items,
      total: result.total,
      currentPage,
      perPage,
      lastPage: Math.ceil(result.total / perPage),
    };
  }
}

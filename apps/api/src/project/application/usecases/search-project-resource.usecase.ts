import {
  PaginationOutput,
  PaginationOutputMapper,
} from '@/shared/application/dtos/pagination-output';
import { SearchInput } from '@/shared/application/dtos/search-input';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import {
  ProjectResourceFilter,
  ProjectResourceRepository,
  ProjectResourceSearchParams,
  ProjectResourceSearchResult,
} from '@/project/domain/repositories/project-resource.repository';
import { ProjectResourceType } from '@/project/domain/entities/project-resource-type.enum';
import {
  ProjectResourceOutput,
  ProjectResourceOutputMapper,
} from '../dto/project-resource.dto';

export type SearchProjectResourceUseCaseInput = Omit<
  SearchInput<ProjectResourceFilter>,
  'filter'
> & {
  userId: string;
  projectId: string;
  label?: string;
  url?: string;
  type?: ProjectResourceType;
};

export type SearchProjectResourceUseCaseOutput =
  PaginationOutput<ProjectResourceOutput>;

export class SearchProjectResourceUseCase implements UseCaseContract<
  SearchProjectResourceUseCaseInput,
  SearchProjectResourceUseCaseOutput
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectResourceRepository: ProjectResourceRepository,
  ) {}

  async execute(
    input: SearchProjectResourceUseCaseInput,
  ): Promise<SearchProjectResourceUseCaseOutput> {
    const { userId, projectId, label, url, type, ...searchProps } = input;
    const project = await this.projectRepository.findById(projectId);

    if (!project || project.userId !== userId) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const filter: ProjectResourceFilter = { projectId };
    if (label) filter.label = label;
    if (url) filter.url = url;
    if (type !== undefined) filter.type = type;

    const params = new ProjectResourceSearchParams({
      ...searchProps,
      filter,
    });
    const result = await this.projectResourceRepository.search(params);

    return this.toOutput(result);
  }

  private toOutput(
    result: ProjectResourceSearchResult,
  ): SearchProjectResourceUseCaseOutput {
    const items = result.items.map((item) =>
      ProjectResourceOutputMapper.toOutput(item),
    );

    return PaginationOutputMapper.toOutout(items, result);
  }
}

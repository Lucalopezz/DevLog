import {
  PaginationOutput,
  PaginationOutputMapper,
} from '@/shared/application/dtos/pagination-output';
import { SearchInput } from '@/shared/application/dtos/search-input';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import {
  ProjectCommandFilter,
  ProjectCommandRepository,
  ProjectCommandSearchParams,
  ProjectCommandSearchResult,
} from '@/project/domain/repositories/project-command.repository';
import {
  ProjectCommandOutput,
  ProjectCommandOutputMapper,
} from '../dto/project-command.dto';

export type SearchProjectCommandUseCaseInput = Omit<
  SearchInput<ProjectCommandFilter>,
  'filter'
> & {
  userId: string;
  projectId: string;
  title?: string;
  command?: string;
  description?: string;
};

export type SearchProjectCommandUseCaseOutput =
  PaginationOutput<ProjectCommandOutput>;

export class SearchProjectCommandUseCase implements UseCaseContract<
  SearchProjectCommandUseCaseInput,
  SearchProjectCommandUseCaseOutput
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectCommandRepository: ProjectCommandRepository,
  ) {}

  async execute(
    input: SearchProjectCommandUseCaseInput,
  ): Promise<SearchProjectCommandUseCaseOutput> {
    const { userId, projectId, title, command, description, ...searchProps } =
      input;
    const project = await this.projectRepository.findById(projectId);

    if (!project || project.userId !== userId) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const filter: ProjectCommandFilter = { projectId };
    if (title) filter.title = title;
    if (command) filter.command = command;
    if (description) filter.description = description;

    const params = new ProjectCommandSearchParams({
      ...searchProps,
      filter,
    });
    const result = await this.projectCommandRepository.search(params);

    return this.toOutput(result);
  }

  private toOutput(
    result: ProjectCommandSearchResult,
  ): SearchProjectCommandUseCaseOutput {
    const items = result.items.map((item) =>
      ProjectCommandOutputMapper.toOutput(item),
    );

    return PaginationOutputMapper.toOutout(items, result);
  }
}

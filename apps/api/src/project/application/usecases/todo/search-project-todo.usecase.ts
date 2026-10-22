import { NotFoundException } from '@nestjs/common';
import {
  PaginationOutput,
  PaginationOutputMapper,
} from '@/shared/application/dtos/pagination-output';
import { SearchInput } from '@/shared/application/dtos/search-input';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import {
  ProjectTodoFilter,
  ProjectTodoRepository,
  ProjectTodoSearchParams,
} from '@/project/domain/repositories/todo/project-todo.repository';
import {
  ProjectTodoOutput,
  ProjectTodoOutputMapper,
} from '../../dto/todo/project-todo.dto';

export type SearchProjectTodoUseCaseInput = Omit<
  SearchInput<ProjectTodoFilter>,
  'filter'
> & {
  userId: string;
  projectId: string;
};

export class SearchProjectTodoUseCase implements UseCaseContract<
  SearchProjectTodoUseCaseInput,
  PaginationOutput<ProjectTodoOutput>
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly todoRepository: ProjectTodoRepository,
  ) {}

  async execute(
    input: SearchProjectTodoUseCaseInput,
  ): Promise<PaginationOutput<ProjectTodoOutput>> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId)
      throw new NotFoundException('Project not found');

    const result = await this.todoRepository.search(
      new ProjectTodoSearchParams({
        page: input.page,
        perPage: input.perPage ?? 20,
        sort: input.sort,
        sortDir: input.sortDir,
        filter: { projectId: project.id },
      }),
    );
    return PaginationOutputMapper.toOutout(
      result.items.map((todo) => ProjectTodoOutputMapper.toOutput(todo)),
      result,
    );
  }
}

import { NotFoundException } from '@nestjs/common';
import {
  PaginationOutput,
  PaginationOutputMapper,
} from '@/shared/application/dtos/pagination-output';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import {
  ProjectEnvironmentRepository,
  ProjectEnvironmentSearchParams,
} from '@/project/domain/repositories/environment/project-environment.repository';
import {
  ProjectEnvironmentOutput,
  ProjectEnvironmentOutputMapper,
} from '../../dto/environment/project-environment.dto';

export type SearchProjectEnvironmentUseCaseInput = {
  userId: string;
  projectId: string;
  page?: number;
  perPage?: number;
  sort?: string;
  sortDir?: 'asc' | 'desc';
};
export class SearchProjectEnvironmentUseCase implements UseCaseContract<
  SearchProjectEnvironmentUseCaseInput,
  PaginationOutput<ProjectEnvironmentOutput>
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly environmentRepository: ProjectEnvironmentRepository,
  ) {}
  async execute(
    input: SearchProjectEnvironmentUseCaseInput,
  ): Promise<PaginationOutput<ProjectEnvironmentOutput>> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId)
      throw new NotFoundException('Project not found');
    const result = await this.environmentRepository.search(
      new ProjectEnvironmentSearchParams({
        page: input.page,
        perPage: input.perPage,
        sort: input.sort,
        sortDir: input.sortDir,
        filter: { projectId: project.id },
      }),
    );
    return PaginationOutputMapper.toOutout(
      result.items.map((item) =>
        ProjectEnvironmentOutputMapper.toOutput(item, project.name),
      ),
      result,
    );
  }
}

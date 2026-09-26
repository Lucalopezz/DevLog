import {
  PaginationOutput,
  PaginationOutputMapper,
} from '@/shared/application/dtos/pagination-output';
import { SearchInput } from '@/shared/application/dtos/search-input';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { UnauthorizedException } from '@nestjs/common';
import {
  ProjectEnvironmentFilter,
  ProjectEnvironmentRepository,
  ProjectEnvironmentSearchParams,
} from '@/project/domain/repositories/environment/project-environment.repository';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import {
  ProjectEnvironmentOutput,
  ProjectEnvironmentOutputMapper,
} from '../../dto/environment/project-environment.dto';

export type SearchOwnerProjectEnvironmentsInput = Omit<
  SearchInput<ProjectEnvironmentFilter>,
  'filter'
> &
  Omit<ProjectEnvironmentFilter, 'userId'> & { userId: string };
export class SearchOwnerProjectEnvironmentsUseCase implements UseCaseContract<
  SearchOwnerProjectEnvironmentsInput,
  PaginationOutput<ProjectEnvironmentOutput>
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly environmentRepository: ProjectEnvironmentRepository,
  ) {}
  async execute(
    input: SearchOwnerProjectEnvironmentsInput,
  ): Promise<PaginationOutput<ProjectEnvironmentOutput>> {
    if (!input.userId)
      throw new UnauthorizedException('Authentication required');
    const { userId, search, category, projectId, ...searchProps } = input;
    const params = new ProjectEnvironmentSearchParams({
      ...searchProps,
      filter: { userId, search, category, projectId },
    });
    const result = await this.environmentRepository.search(params);
    // One owner-scoped project read supplies display names for the page of
    // environments without making a request for each environment.
    const projects = result.items.length
      ? await this.projectRepository.findByOwnerId(userId)
      : [];
    const namesByProjectId = new Map(
      projects.map((project) => [project.id, project.name]),
    );
    const items = result.items.map((item) => {
      const projectName = namesByProjectId.get(item.projectId);
      if (projectName === undefined) throw new Error('Project name is missing');
      return ProjectEnvironmentOutputMapper.toOutput(item, projectName);
    });
    return PaginationOutputMapper.toOutout(items, result);
  }
}

import {
  ProjectResourceOutput,
  ProjectResourceOutputMapper,
} from '@/project/application/dto/resource/project-resource.dto';
import { ProjectResourceRepository } from '@/project/domain/repositories/resource/project-resource.repository';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { NotFoundException } from '@nestjs/common';

export type GetProjectResourceUseCaseInput = {
  userId: string;
  projectId: string;
  resourceId: string;
};

export type GetProjectResourceUseCaseOutput = ProjectResourceOutput;

export class GetProjectResourceUseCase implements UseCaseContract<
  GetProjectResourceUseCaseInput,
  GetProjectResourceUseCaseOutput
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectResourceRepository: ProjectResourceRepository,
  ) {}

  async execute(
    input: GetProjectResourceUseCaseInput,
  ): Promise<GetProjectResourceUseCaseOutput> {
    const project = await this.projectRepository.findById(input.projectId);

    if (!project || project.userId !== input.userId) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const resource = await this.projectResourceRepository.findById(
      input.resourceId,
    );

    if (!resource || resource.projectId !== project.id) {
      throw new NotFoundException('Recurso não encontrado');
    }

    return ProjectResourceOutputMapper.toOutput(resource);
  }
}

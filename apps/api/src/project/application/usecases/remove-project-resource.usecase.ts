import { ProjectResourceRepository } from '@/project/domain/repositories/project-resource.repository';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { NotFoundException } from '@nestjs/common';

export type RemoveProjectResourceUseCaseInput = {
  userId: string;
  projectId: string;
  resourceId: string;
};

export type RemoveProjectResourceUseCaseOutput = void;

export class RemoveProjectResourceUseCase implements UseCaseContract<
  RemoveProjectResourceUseCaseInput,
  RemoveProjectResourceUseCaseOutput
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectResourceRepository: ProjectResourceRepository,
  ) {}

  async execute(input: RemoveProjectResourceUseCaseInput): Promise<void> {
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

    await this.projectResourceRepository.delete(resource.id);
  }
}

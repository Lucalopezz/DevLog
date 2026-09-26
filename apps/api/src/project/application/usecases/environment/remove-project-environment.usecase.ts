import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { ProjectEnvironmentRepository } from '@/project/domain/repositories/environment/project-environment.repository';

export type RemoveProjectEnvironmentUseCaseInput = {
  userId: string;
  projectId: string;
  environmentId: string;
};
export class RemoveProjectEnvironmentUseCase implements UseCaseContract<
  RemoveProjectEnvironmentUseCaseInput,
  void
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly environmentRepository: ProjectEnvironmentRepository,
  ) {}
  async execute(input: RemoveProjectEnvironmentUseCaseInput): Promise<void> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId)
      throw new NotFoundException('Project not found');
    project.ensureCanBeModified();
    const entity = await this.environmentRepository.findById(
      input.environmentId,
    );
    if (!entity || entity.projectId !== project.id)
      throw new NotFoundException('Environment not found');
    await this.environmentRepository.delete(entity.id);
  }
}

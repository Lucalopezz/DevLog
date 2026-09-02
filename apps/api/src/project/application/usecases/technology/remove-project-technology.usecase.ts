import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { ProjectTechnologyRepository } from '@/project/domain/repositories/technology/project-technology.repository';

export type RemoveProjectTechnologyUseCaseInput = {
  userId: string;
  projectId: string;
  technologyId: string;
};

export type RemoveProjectTechnologyUseCaseOutput = void;

export class RemoveProjectTechnologyUseCase implements UseCaseContract<
  RemoveProjectTechnologyUseCaseInput,
  RemoveProjectTechnologyUseCaseOutput
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectTechnologyRepository: ProjectTechnologyRepository,
  ) {}

  async execute(input: RemoveProjectTechnologyUseCaseInput): Promise<void> {
    const project = await this.projectRepository.findById(input.projectId);

    if (!project || project.userId !== input.userId) {
      throw new NotFoundException('Projeto não encontrado');
    }

    project.ensureCanBeModified();

    const technology = await this.projectTechnologyRepository.findById(
      input.technologyId,
    );

    if (!technology || technology.projectId !== project.id) {
      throw new NotFoundException('Tecnologia não encontrada');
    }

    await this.projectTechnologyRepository.delete(technology.id);
  }
}

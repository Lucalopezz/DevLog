import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import { ProjectOutput, ProjectOutputMapper } from '../dto/project.dto';

export type ToggleProjectArchiveUseCaseInput = {
  id: string;
  userId: string;
};

export type ToggleProjectArchiveUseCaseOutput = ProjectOutput;

export class ToggleProjectArchiveUseCase implements UseCaseContract<
  ToggleProjectArchiveUseCaseInput,
  ToggleProjectArchiveUseCaseOutput
> {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(
    input: ToggleProjectArchiveUseCaseInput,
  ): Promise<ToggleProjectArchiveUseCaseOutput> {
    const project = await this.projectRepository.findById(input.id);

    if (project === null || project.userId !== input.userId) {
      throw new NotFoundException('Projeto não encontrado');
    }

    project.toggleArchive();

    await this.projectRepository.update(project);

    return ProjectOutputMapper.toOutput(project);
  }
}

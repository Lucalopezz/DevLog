import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import { ProjectOutput, ProjectOutputMapper } from '../dto/project.dto';

export type ArchiveProjectUseCaseInput = {
  id: string;
  userId: string;
};

export type ArchiveProjectUseCaseOutput = ProjectOutput;

export class ArchiveProjectUseCase implements UseCaseContract<
  ArchiveProjectUseCaseInput,
  ArchiveProjectUseCaseOutput
> {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(
    input: ArchiveProjectUseCaseInput,
  ): Promise<ArchiveProjectUseCaseOutput> {
    const project = await this.projectRepository.findById(input.id);

    if (project === null || project.userId !== input.userId) {
      throw new NotFoundException('Projeto não encontrado');
    }

    project.archive();

    await this.projectRepository.update(project);

    return ProjectOutputMapper.toOutput(project);
  }
}

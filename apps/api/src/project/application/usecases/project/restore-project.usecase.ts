import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import {
  ProjectOutput,
  ProjectOutputMapper,
} from '../../dto/project/project.dto';

export type RestoreProjectUseCaseInput = {
  id: string;
  userId: string;
};

export type RestoreProjectUseCaseOutput = ProjectOutput;

export class RestoreProjectUseCase implements UseCaseContract<
  RestoreProjectUseCaseInput,
  RestoreProjectUseCaseOutput
> {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(
    input: RestoreProjectUseCaseInput,
  ): Promise<RestoreProjectUseCaseOutput> {
    const project = await this.projectRepository.findById(input.id);

    if (project === null || project.userId !== input.userId) {
      throw new NotFoundException('Projeto não encontrado');
    }

    project.restore();

    await this.projectRepository.update(project);

    return ProjectOutputMapper.toOutput(project);
  }
}

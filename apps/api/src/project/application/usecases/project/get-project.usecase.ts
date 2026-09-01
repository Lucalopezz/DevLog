import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import {
  ProjectOutput,
  ProjectOutputMapper,
} from '../../dto/project/project.dto';

export type GetProjectUseCaseInput = {
  id: string;
  userId: string;
};

export type GetProjectUseCaseOutput = ProjectOutput;

export class GetProjectUseCase implements UseCaseContract<
  GetProjectUseCaseInput,
  GetProjectUseCaseOutput
> {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(
    input: GetProjectUseCaseInput,
  ): Promise<GetProjectUseCaseOutput> {
    const project = await this.projectRepository.findById(input.id);

    if (project === null || project.userId !== input.userId) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return ProjectOutputMapper.toOutput(project);
  }
}

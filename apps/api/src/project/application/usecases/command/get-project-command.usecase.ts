import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { ProjectCommandRepository } from '@/project/domain/repositories/command/project-command.repository';
import {
  ProjectCommandOutput,
  ProjectCommandOutputMapper,
} from '../../dto/command/project-command.dto';

export type GetProjectCommandUseCaseInput = {
  userId: string;
  projectId: string;
  commandId: string;
};

export type GetProjectCommandUseCaseOutput = ProjectCommandOutput;

export class GetProjectCommandUseCase implements UseCaseContract<
  GetProjectCommandUseCaseInput,
  GetProjectCommandUseCaseOutput
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectCommandRepository: ProjectCommandRepository,
  ) {}

  async execute(
    input: GetProjectCommandUseCaseInput,
  ): Promise<GetProjectCommandUseCaseOutput> {
    const project = await this.projectRepository.findById(input.projectId);

    if (!project || project.userId !== input.userId) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const command = await this.projectCommandRepository.findById(
      input.commandId,
    );

    if (!command || command.projectId !== project.id) {
      throw new NotFoundException('Comando não encontrado');
    }

    return ProjectCommandOutputMapper.toOutput(command);
  }
}

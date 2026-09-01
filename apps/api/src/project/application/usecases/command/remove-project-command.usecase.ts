import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { ProjectCommandRepository } from '@/project/domain/repositories/command/project-command.repository';

export type RemoveProjectCommandUseCaseInput = {
  userId: string;
  projectId: string;
  commandId: string;
};

export type RemoveProjectCommandUseCaseOutput = void;

export class RemoveProjectCommandUseCase implements UseCaseContract<
  RemoveProjectCommandUseCaseInput,
  RemoveProjectCommandUseCaseOutput
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectCommandRepository: ProjectCommandRepository,
  ) {}

  async execute(input: RemoveProjectCommandUseCaseInput): Promise<void> {
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

    await this.projectCommandRepository.delete(command.id);
  }
}

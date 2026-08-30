import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectCommandRepository } from '@/project/domain/repositories/project-command.repository';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import {
  ProjectCommandOutput,
  ProjectCommandOutputMapper,
} from '../dto/project-command.dto';

export type AddProjectCommandUseCaseInput = {
  userId: string;
  projectId: string;
  title: string;
  command: string;
  description?: string;
  executionOrder?: number;
};

export type AddProjectCommandUseCaseOutput = ProjectCommandOutput;

export class AddProjectCommandUseCase implements UseCaseContract<
  AddProjectCommandUseCaseInput,
  AddProjectCommandUseCaseOutput
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectCommandRepository: ProjectCommandRepository,
  ) {}

  async execute(
    input: AddProjectCommandUseCaseInput,
  ): Promise<AddProjectCommandUseCaseOutput> {
    const { userId, projectId, title, command, description, executionOrder } =
      input;
    const project = await this.projectRepository.findById(projectId);

    if (!project || project.userId !== userId) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const entity = project.addCommand(
      title,
      command,
      description,
      executionOrder,
    );

    await this.projectCommandRepository.insert(entity);

    return ProjectCommandOutputMapper.toOutput(entity);
  }
}

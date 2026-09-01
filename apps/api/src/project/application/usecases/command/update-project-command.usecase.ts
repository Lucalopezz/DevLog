import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectCommandRepository } from '@/project/domain/repositories/command/project-command.repository';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import {
  ProjectCommandOutput,
  ProjectCommandOutputMapper,
} from '../../dto/command/project-command.dto';

export type UpdateProjectCommandUseCaseInput = {
  commandId: string;
  userId: string;
  projectId: string;
  title?: string;
  command?: string;
  description?: string | null;
  executionOrder?: number | null;
};

export type UpdateProjectCommandUseCaseOutput = ProjectCommandOutput;

export class UpdateProjectCommandUseCase implements UseCaseContract<
  UpdateProjectCommandUseCaseInput,
  UpdateProjectCommandUseCaseOutput
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectCommandRepository: ProjectCommandRepository,
  ) {}

  async execute(
    input: UpdateProjectCommandUseCaseInput,
  ): Promise<UpdateProjectCommandUseCaseOutput> {
    const { userId, projectId, title, command, description, executionOrder } =
      input;
    const project = await this.projectRepository.findById(projectId);

    if (!project || project.userId !== userId) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const entity = await this.projectCommandRepository.findById(
      input.commandId,
    );
    if (!entity || entity.projectId !== projectId) {
      throw new NotFoundException('Comando do projeto não encontrado');
    }

    if (
      title === undefined &&
      command === undefined &&
      description === undefined &&
      executionOrder === undefined
    ) {
      throw new UnprocessableEntityException(
        'Informe ao menos um campo para atualizar o comando',
      );
    }

    entity.update({
      ...(title !== undefined ? { title } : {}),
      ...(command !== undefined ? { command } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(executionOrder !== undefined ? { executionOrder } : {}),
    });

    await this.projectCommandRepository.update(entity);

    return ProjectCommandOutputMapper.toOutput(entity);
  }
}

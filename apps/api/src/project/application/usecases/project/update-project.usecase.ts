import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import {
  ProjectOutput,
  ProjectOutputMapper,
} from '../../dto/project/project.dto';

export type UpdateProjectUseCaseInput = {
  id: string;
  userId: string;
  name?: string;
  description?: string | null;
  status?: ProjectStatusEnum;
  localPath?: string | null;
};

export type UpdateProjectUseCaseOutput = ProjectOutput;

export class UpdateProjectUseCase implements UseCaseContract<
  UpdateProjectUseCaseInput,
  UpdateProjectUseCaseOutput
> {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(
    input: UpdateProjectUseCaseInput,
  ): Promise<UpdateProjectUseCaseOutput> {
    const project = await this.projectRepository.findById(input.id);

    if (project === null || project.userId !== input.userId) {
      throw new NotFoundException('Projeto não encontrado');
    }

    if (
      input.name === undefined &&
      input.description === undefined &&
      input.status === undefined &&
      input.localPath === undefined
    ) {
      throw new UnprocessableEntityException(
        'Informe ao menos um campo para atualizar o projeto',
      );
    }

    project.update({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.localPath !== undefined ? { localPath: input.localPath } : {}),
    });

    await this.projectRepository.update(project);

    return ProjectOutputMapper.toOutput(project);
  }
}

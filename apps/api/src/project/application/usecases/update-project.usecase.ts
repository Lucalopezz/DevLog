import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import { ProjectStatusEnum } from '@/project/domain/entities/project-status-enum';
import { ProjectOutput, ProjectOutputMapper } from '../dto/project.dto';

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

    project.update({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    });

    if (Object.prototype.hasOwnProperty.call(input, 'description')) {
      project.updateDescription(input.description || undefined);
    }

    if (Object.prototype.hasOwnProperty.call(input, 'localPath')) {
      project.updatePath(input.localPath || undefined);
    }

    await this.projectRepository.update(project);

    return ProjectOutputMapper.toOutput(project);
  }
}

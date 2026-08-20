import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import { ProjectStatusEnum } from '@/project/domain/entities/project-status-enum';
import { ProjectOutput, ProjectOutputMapper } from '../dto/project.dto';

export type UpdateProjectUseCaseInput = {
  id: string;
  userId: string;
  name?: string;
  status?: ProjectStatusEnum;
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

    await this.projectRepository.update(project);

    return ProjectOutputMapper.toOutput(project);
  }
}

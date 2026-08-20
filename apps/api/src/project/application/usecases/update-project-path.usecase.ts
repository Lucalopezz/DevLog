import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import { ProjectOutput, ProjectOutputMapper } from '../dto/project.dto';

export type UpdateProjectPathUseCaseInput = {
  id: string;
  userId: string;
  localPath: string;
};

export type UpdateProjectPathUseCaseOutput = ProjectOutput;

export class UpdateProjectPathUseCase implements UseCaseContract<
  UpdateProjectPathUseCaseInput,
  UpdateProjectPathUseCaseOutput
> {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(
    input: UpdateProjectPathUseCaseInput,
  ): Promise<UpdateProjectPathUseCaseOutput> {
    const project = await this.projectRepository.findById(input.id);

    if (project === null || project.userId !== input.userId) {
      throw new NotFoundException('Projeto não encontrado');
    }

    project.updatePath(input.localPath || undefined);

    await this.projectRepository.update(project);

    return ProjectOutputMapper.toOutput(project);
  }
}

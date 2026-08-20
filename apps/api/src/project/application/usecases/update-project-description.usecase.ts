import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import { ProjectOutput, ProjectOutputMapper } from '../dto/project.dto';

export type UpdateProjectDescriptionUseCaseInput = {
  id: string;
  userId: string;
  description: string;
};

export type UpdateProjectDescriptionUseCaseOutput = ProjectOutput;

export class UpdateProjectDescriptionUseCase implements UseCaseContract<
  UpdateProjectDescriptionUseCaseInput,
  UpdateProjectDescriptionUseCaseOutput
> {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(
    input: UpdateProjectDescriptionUseCaseInput,
  ): Promise<UpdateProjectDescriptionUseCaseOutput> {
    const project = await this.projectRepository.findById(input.id);

    if (project === null || project.userId !== input.userId) {
      throw new NotFoundException('Projeto não encontrado');
    }

    project.updateDescription(input.description || undefined);

    await this.projectRepository.update(project);

    return ProjectOutputMapper.toOutput(project);
  }
}

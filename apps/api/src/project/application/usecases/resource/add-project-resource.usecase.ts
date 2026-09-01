import {
  ProjectResourceOutput,
  ProjectResourceOutputMapper,
} from '@/project/application/dto/resource/project-resource.dto';
import { ProjectResourceType } from '@/project/domain/entities/resource/project-resource-type.enum';
import { ProjectResourceRepository } from '@/project/domain/repositories/resource/project-resource.repository';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { NotFoundException } from '@nestjs/common';

export type AddProjectResourceUseCaseInput = {
  userId: string;
  projectId: string;
  label: string;
  url: string;
  type?: ProjectResourceType;
};

export type AddProjectResourceUseCaseOutput = ProjectResourceOutput;

export class AddProjectResourceUseCase implements UseCaseContract<
  AddProjectResourceUseCaseInput,
  AddProjectResourceUseCaseOutput
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectResourceRepository: ProjectResourceRepository,
  ) {}

  async execute(
    input: AddProjectResourceUseCaseInput,
  ): Promise<AddProjectResourceUseCaseOutput> {
    const project = await this.projectRepository.findById(input.projectId);

    if (!project || project.userId !== input.userId) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const entity = project.addResource(
      input.label,
      input.url,
      input.type ?? ProjectResourceType.OTHER,
    );

    await this.projectResourceRepository.insert(entity);

    return ProjectResourceOutputMapper.toOutput(entity);
  }
}

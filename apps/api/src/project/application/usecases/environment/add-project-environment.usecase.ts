import { ConflictException, NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { ProjectEnvironmentRepository } from '@/project/domain/repositories/environment/project-environment.repository';
import { ProjectEnvironmentCategory } from '@/project/domain/entities/environment/project-environment-category.enum';
import {
  ProjectEnvironmentOutput,
  ProjectEnvironmentOutputMapper,
} from '../../dto/environment/project-environment.dto';

export type AddProjectEnvironmentUseCaseInput = {
  userId: string;
  projectId: string;
  name: string;
  category: ProjectEnvironmentCategory;
  operatingSystem?: string;
  runtime?: string;
  runtimeVersion?: string;
  description?: string;
};
export class AddProjectEnvironmentUseCase implements UseCaseContract<
  AddProjectEnvironmentUseCaseInput,
  ProjectEnvironmentOutput
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly environmentRepository: ProjectEnvironmentRepository,
  ) {}
  async execute(
    input: AddProjectEnvironmentUseCaseInput,
  ): Promise<ProjectEnvironmentOutput> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId)
      throw new NotFoundException('Project not found');
    // The aggregate protects its children when it has been archived.
    const {
      name,
      category,
      operatingSystem,
      runtime,
      runtimeVersion,
      description,
    } = input;
    const entity = project.addEnvironment({
      name,
      category,
      operatingSystem,
      runtime,
      runtimeVersion,
      description,
    });
    const existing = await this.environmentRepository.findByNormalizedName(
      project.id,
      entity.normalizedName,
    );
    if (existing)
      throw new ConflictException(
        'Environment name already exists in this project',
      );
    await this.environmentRepository.insert(entity);
    return ProjectEnvironmentOutputMapper.toOutput(entity, project.name);
  }
}

import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { ProjectEnvironmentUpdateProps } from '@/project/domain/entities/environment/project-environment.entity';
import { ProjectEnvironmentRepository } from '@/project/domain/repositories/environment/project-environment.repository';
import {
  ProjectEnvironmentOutput,
  ProjectEnvironmentOutputMapper,
} from '../../dto/environment/project-environment.dto';

export type UpdateProjectEnvironmentUseCaseInput =
  ProjectEnvironmentUpdateProps & {
    userId: string;
    projectId: string;
    environmentId: string;
  };
export class UpdateProjectEnvironmentUseCase implements UseCaseContract<
  UpdateProjectEnvironmentUseCaseInput,
  ProjectEnvironmentOutput
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly environmentRepository: ProjectEnvironmentRepository,
  ) {}
  async execute(
    input: UpdateProjectEnvironmentUseCaseInput,
  ): Promise<ProjectEnvironmentOutput> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId)
      throw new NotFoundException('Project not found');
    project.ensureCanBeModified();
    const entity = await this.environmentRepository.findById(
      input.environmentId,
    );
    if (!entity || entity.projectId !== project.id)
      throw new NotFoundException('Environment not found');
    const {
      name,
      category,
      operatingSystem,
      runtime,
      runtimeVersion,
      description,
    } = input;
    if (
      [
        name,
        category,
        operatingSystem,
        runtime,
        runtimeVersion,
        description,
      ].every((value) => value === undefined)
    ) {
      throw new UnprocessableEntityException(
        'Provide at least one field to update the environment',
      );
    }
    entity.update({
      name,
      category,
      operatingSystem,
      runtime,
      runtimeVersion,
      description,
    });
    if (name !== undefined) {
      const duplicate = await this.environmentRepository.findByNormalizedName(
        project.id,
        entity.normalizedName,
      );
      if (duplicate && duplicate.id !== entity.id)
        throw new ConflictException(
          'Environment name already exists in this project',
        );
    }
    await this.environmentRepository.update(entity);
    return ProjectEnvironmentOutputMapper.toOutput(entity, project.name);
  }
}

import {
  ProjectResourceOutput,
  ProjectResourceOutputMapper,
} from '@/project/application/dto/resource/project-resource.dto';
import { ProjectResourceType } from '@/project/domain/entities/resource/project-resource-type.enum';
import { ProjectResourceRepository } from '@/project/domain/repositories/resource/project-resource.repository';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

export type UpdateProjectResourceUseCaseInput = {
  userId: string;
  projectId: string;
  resourceId: string;
  label?: string;
  url?: string;
  type?: ProjectResourceType;
};

export type UpdateProjectResourceUseCaseOutput = ProjectResourceOutput;

export class UpdateProjectResourceUseCase implements UseCaseContract<
  UpdateProjectResourceUseCaseInput,
  UpdateProjectResourceUseCaseOutput
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectResourceRepository: ProjectResourceRepository,
  ) {}

  async execute(
    input: UpdateProjectResourceUseCaseInput,
  ): Promise<UpdateProjectResourceUseCaseOutput> {
    const project = await this.projectRepository.findById(input.projectId);

    if (!project || project.userId !== input.userId) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const entity = await this.projectResourceRepository.findById(
      input.resourceId,
    );

    if (!entity || entity.projectId !== project.id) {
      throw new NotFoundException('Recurso do projeto não encontrado');
    }

    if (
      input.label === undefined &&
      input.url === undefined &&
      input.type === undefined
    ) {
      throw new UnprocessableEntityException(
        'Informe ao menos um campo para atualizar o recurso',
      );
    }

    entity.update({
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.url !== undefined ? { url: input.url } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
    });

    await this.projectResourceRepository.update(entity);

    return ProjectResourceOutputMapper.toOutput(entity);
  }
}

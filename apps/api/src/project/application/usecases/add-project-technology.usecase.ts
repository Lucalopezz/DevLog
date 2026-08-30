import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectTechnologyRepository } from '@/project/domain/repositories/project-technology.repository';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import { ProjectOutput, ProjectOutputMapper } from '../dto/project.dto';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

export type AddProjectTechnologyUseCaseInput = {
  userId: string;
  projectId: string;
  name: string;
  version?: string;
};

export type AddProjectTechnologyUseCaseOutput = ProjectOutput;

export class AddProjectTechnologyUseCase implements UseCaseContract<
  AddProjectTechnologyUseCaseInput,
  AddProjectTechnologyUseCaseOutput
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectTechnologyRepository: ProjectTechnologyRepository,
  ) {}

  async execute(
    input: AddProjectTechnologyUseCaseInput,
  ): Promise<AddProjectTechnologyUseCaseOutput> {
    const { userId, projectId, name, version } = input;
    const project = await this.projectRepository.findById(projectId);

    if (!project || project.userId !== userId) {
      throw new NotFoundException('Projeto não encontrado');
    }
    const technologyExists = await this.projectTechnologyRepository.findByName(
      projectId,
      name,
    );

    if (technologyExists !== null) {
      throw new UnprocessableEntityException(
        `Tecnologia ${name} já existe no projeto`,
      );
    }
    const technology = project.addTechnology(name, version);
    await this.projectTechnologyRepository.insert(technology);

    return ProjectOutputMapper.toOutput(project, [technology]);
  }
}

import { ConflictException, NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import {
  ProjectOutput,
  ProjectOutputMapper,
} from '../../dto/project/project.dto';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { UserRepository } from '@/user/domain/repositories/user.repository';
import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';

export type CreateProjectUseCaseInput = {
  userId: string;
  name: string;
  description?: string;
};

export type CreateProjectUseCaseOutput = ProjectOutput;

export class CreateProjectUseCase implements UseCaseContract<
  CreateProjectUseCaseInput,
  CreateProjectUseCaseOutput
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly userRepository: UserRepository,
  ) { }

  async execute(
    input: CreateProjectUseCaseInput,
  ): Promise<CreateProjectUseCaseOutput> {
    const { userId, name, description } = input;
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const entity = new ProjectEntity({
      userId,
      name,
      description,
      status: ProjectStatusEnum.ACTIVE,
    });

    // The application check gives the user a meaningful 409 response. The
    // database unique constraint remains necessary for concurrent requests.
    const projectExists = await this.projectRepository.findByNameAndOwnerId(
      entity.name,
      entity.userId,
    );

    if (projectExists) {
      throw new ConflictException(
        'Project with this name already exists for this user',
      );
    }

    await this.projectRepository.insert(entity);

    return ProjectOutputMapper.toOutput(entity);
  }
}

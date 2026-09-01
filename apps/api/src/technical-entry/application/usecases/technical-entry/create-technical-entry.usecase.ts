import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry/technical-entry-type.enum';
import {
  TechnicalEntryOutput,
  TechnicalEntryOutputMapper,
} from '../../dto/technical-entry/technical-entry.dto';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';
import { UserRepository } from '@/user/domain/repositories/user.repository';
import { NotFoundException } from '@nestjs/common';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry/technical-entry.entity';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';

export type CreateTechnicalEntryUseCaseInput = {
  userId: string;
  title: string;
  projectId?: string | null;
  context: string;
  conclusion?: string;
  type: TechnicalEntryType;
};

export type CreateTechnicalEntryUseCaseOutput = TechnicalEntryOutput;

export class CreateTechnicalEntryUseCase implements UseCaseContract<
  CreateTechnicalEntryUseCaseInput,
  CreateTechnicalEntryUseCaseOutput
> {
  constructor(
    private readonly technicalEntryRepository: TechnicalEntryRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: CreateTechnicalEntryUseCaseInput,
  ): Promise<TechnicalEntryOutput> {
    const { userId, title, projectId, context, conclusion, type } = input;
    const user = userId ? await this.userRepository.findById(userId) : null;

    if (projectId) {
      const project = await this.projectRepository.findById(projectId);

      if (
        project === null ||
        project.userId !== input.userId ||
        project.archivedAt !== undefined
      ) {
        throw new NotFoundException('Projeto não encontrado');
      }
    }

    if (user === null) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const entity = new TechnicalEntryEntity({
      userId,
      title,
      projectId: projectId ?? undefined,
      context,
      ...(conclusion !== undefined && { conclusion }),
      type,
    });

    await this.technicalEntryRepository.insert(entity);

    return TechnicalEntryOutputMapper.toOutput(entity);
  }
}

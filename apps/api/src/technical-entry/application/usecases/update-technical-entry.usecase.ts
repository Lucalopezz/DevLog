import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry.repository';
import {
  TechnicalEntryOutput,
  TechnicalEntryOutputMapper,
} from '../dto/technical-entry.dto';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';

export type UpdateTechnicalEntryUseCaseInput = {
  id: string;
  userId: string;
  title?: string;
  context?: string;
  conclusion?: string | null;
  projectId?: string | null;
};

export type UpdateTechnicalEntryUseCaseOutput = TechnicalEntryOutput;

export class UpdateTechnicalEntryUseCase implements UseCaseContract<
  UpdateTechnicalEntryUseCaseInput,
  UpdateTechnicalEntryUseCaseOutput
> {
  constructor(
    private readonly technicalEntryRepository: TechnicalEntryRepository,
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(
    input: UpdateTechnicalEntryUseCaseInput,
  ): Promise<TechnicalEntryOutput> {
    const technicalEntry = await this.technicalEntryRepository.findById(
      input.id,
    );

    if (technicalEntry === null || technicalEntry.userId !== input.userId) {
      throw new NotFoundException('Entrada técnica não encontrada');
    }

    const shouldUpdateProject = input.projectId !== undefined;
    // Valida o tipo, pois se nao for string e for nulo ele desvincula, undefined fica inalterado
    if (shouldUpdateProject && typeof input.projectId === 'string') {
      const project = await this.projectRepository.findById(input.projectId);

      if (
        project === null ||
        project.userId !== input.userId ||
        project.archivedAt !== undefined
      ) {
        throw new NotFoundException('Projeto não encontrado');
      }
    }

    technicalEntry.update(input.title, input.context);

    if (input.conclusion !== undefined) {
      technicalEntry.changeConclusion(input.conclusion ?? null);
    }

    if (shouldUpdateProject) {
      technicalEntry.changeProject(input.projectId ?? null);
    }

    await this.technicalEntryRepository.update(technicalEntry);

    return TechnicalEntryOutputMapper.toOutput(technicalEntry);
  }
}

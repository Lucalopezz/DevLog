import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';
import {
  TechnicalEntryOutput,
  TechnicalEntryOutputMapper,
} from '../../dto/technical-entry/technical-entry.dto';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';

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

    if (
      input.title === undefined &&
      input.context === undefined &&
      input.conclusion === undefined &&
      input.projectId === undefined
    ) {
      throw new UnprocessableEntityException(
        'Informe ao menos um campo para atualizar a entrada técnica',
      );
    }

    const shouldUpdateProject = input.projectId !== undefined;
    // undefined preserva o projeto atual, null desvincula e string exige validar
    // a existência, a propriedade e o arquivamento do novo projeto.
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

    technicalEntry.update({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.context !== undefined ? { context: input.context } : {}),
      ...(input.conclusion !== undefined
        ? { conclusion: input.conclusion }
        : {}),
      ...(shouldUpdateProject ? { projectId: input.projectId } : {}),
    });

    await this.technicalEntryRepository.update(technicalEntry);

    return TechnicalEntryOutputMapper.toOutput(technicalEntry);
  }
}

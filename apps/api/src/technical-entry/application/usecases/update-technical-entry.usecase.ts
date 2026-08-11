import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry.repository';
import {
  TechnicalEntryOutput,
  TechnicalEntryOutputMapper,
} from '../dto/technical-entry.dto';

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

    technicalEntry.update(input.title, input.context);

    if (Object.prototype.hasOwnProperty.call(input, 'conclusion')) {
      technicalEntry.changeConclusion(input.conclusion ?? null);
    }

    if (Object.prototype.hasOwnProperty.call(input, 'projectId')) {
      // TODO: validar a propriedade do projeto através do ProjectRepository.
      technicalEntry.changeProject(input.projectId ?? null);
    }

    await this.technicalEntryRepository.update(technicalEntry);

    return TechnicalEntryOutputMapper.toOutput(technicalEntry);
  }
}

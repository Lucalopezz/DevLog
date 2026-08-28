import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { TechnicalEntryStatus } from '@/technical-entry/domain/entities/technical-entry-status.enum';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry.repository';
import {
  TechnicalEntryOutput,
  TechnicalEntryOutputMapper,
} from '../dto/technical-entry.dto';

export type ResolveTechnicalIssueUseCaseInput = {
  id: string;
  userId: string;
  conclusion: string;
};

export type ResolveTechnicalIssueUseCaseOutput = TechnicalEntryOutput;

export class ResolveTechnicalIssueUseCase implements UseCaseContract<
  ResolveTechnicalIssueUseCaseInput,
  ResolveTechnicalIssueUseCaseOutput
> {
  constructor(
    private readonly technicalEntryRepository: TechnicalEntryRepository,
  ) {}

  async execute(
    input: ResolveTechnicalIssueUseCaseInput,
  ): Promise<ResolveTechnicalIssueUseCaseOutput> {
    const technicalEntry = await this.technicalEntryRepository.findById(
      input.id,
    );

    if (technicalEntry === null || technicalEntry.userId !== input.userId) {
      throw new NotFoundException('Entrada técnica não encontrada');
    }

    if (technicalEntry.type !== TechnicalEntryType.ISSUE) {
      throw new UnprocessableEntityException(
        'Somente entradas do tipo ISSUE podem ser concluídas',
      );
    }

    if (technicalEntry.status !== TechnicalEntryStatus.OPEN) {
      throw new UnprocessableEntityException(
        'Somente entradas OPEN podem ser concluídas',
      );
    }

    // A entidade valida a conclusão e registra resolvedAt de forma atômica
    // para manter a transição de domínio em um único ponto.
    technicalEntry.conclude(input.conclusion);

    await this.technicalEntryRepository.update(technicalEntry);

    return TechnicalEntryOutputMapper.toOutput(technicalEntry);
  }
}

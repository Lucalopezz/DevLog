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

export type ReopenTechnicalIssueUseCaseInput = {
  id: string;
  userId: string;
};

export type ReopenTechnicalIssueUseCaseOutput = TechnicalEntryOutput;

export class ReopenTechnicalIssueUseCase implements UseCaseContract<
  ReopenTechnicalIssueUseCaseInput,
  ReopenTechnicalIssueUseCaseOutput
> {
  constructor(
    private readonly technicalEntryRepository: TechnicalEntryRepository,
  ) {}

  async execute(
    input: ReopenTechnicalIssueUseCaseInput,
  ): Promise<ReopenTechnicalIssueUseCaseOutput> {
    const technicalEntry = await this.technicalEntryRepository.findById(
      input.id,
    );

    if (technicalEntry === null || technicalEntry.userId !== input.userId) {
      throw new NotFoundException('Entrada técnica não encontrada');
    }

    if (technicalEntry.type !== TechnicalEntryType.ISSUE) {
      throw new UnprocessableEntityException(
        'Somente entradas do tipo ISSUE podem ser reabertas',
      );
    }

    if (technicalEntry.status !== TechnicalEntryStatus.RESOLVED) {
      throw new UnprocessableEntityException(
        'Somente entradas RESOLVED podem ser reabertas',
      );
    }

    technicalEntry.reopen();

    await this.technicalEntryRepository.update(technicalEntry);

    return TechnicalEntryOutputMapper.toOutput(technicalEntry);
  }
}

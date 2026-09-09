import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';
import {
  TechnicalEntryOutput,
  TechnicalEntryOutputMapper,
} from '../../dto/technical-entry/technical-entry.dto';

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
      throw new NotFoundException('Technical entry not found');
    }

    // The entity is the single source of transition rules. This gives every
    // caller of reopen() the same protection, beyond this use case.
    technicalEntry.reopen();

    await this.technicalEntryRepository.update(technicalEntry);

    return TechnicalEntryOutputMapper.toOutput(technicalEntry);
  }
}

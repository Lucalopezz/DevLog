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
      throw new NotFoundException('Entrada técnica não encontrada');
    }

    // A entidade é a única fonte das regras da transição. Assim, qualquer
    // chamador de reopen() recebe a mesma proteção, não apenas este caso de uso.
    technicalEntry.reopen();

    await this.technicalEntryRepository.update(technicalEntry);

    return TechnicalEntryOutputMapper.toOutput(technicalEntry);
  }
}

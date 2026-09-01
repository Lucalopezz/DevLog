import { SolutionAttemptResult } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt-result.enum';
import {
  SolutionAttemptOutput,
  SolutionAttemptOutputMapper,
} from '../../dto/solution-attempt/solution-attempt.dto';
import { SolutionAttemptRepository } from '@/technical-entry/domain/repositories/solution-attempt/solution-attempt.repository';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry/technical-entry-type.enum';

export type AddSolutionAttemptUseCaseInput = {
  userId: string;
  technicalEntryId: string;
  description: string;
  result: SolutionAttemptResult;
};

export type AddSolutionAttemptUseCaseOutput = SolutionAttemptOutput;

export class AddSolutionAttemptUseCase implements UseCaseContract<
  AddSolutionAttemptUseCaseInput,
  AddSolutionAttemptUseCaseOutput
> {
  constructor(
    private readonly technicalEntryRepository: TechnicalEntryRepository,
    private readonly solutionAttemptRepository: SolutionAttemptRepository,
  ) {}

  async execute(
    input: AddSolutionAttemptUseCaseInput,
  ): Promise<SolutionAttemptOutput> {
    const { userId, technicalEntryId, description, result } = input;

    const technicalEntry =
      await this.technicalEntryRepository.findById(technicalEntryId);
    if (!technicalEntry || technicalEntry.userId !== userId) {
      throw new NotFoundException('Entrada técnica não encontrada');
    }

    if (
      technicalEntry.type !== TechnicalEntryType.ISSUE ||
      technicalEntry.archivedAt
    ) {
      throw new UnprocessableEntityException(
        'Somente entradas do tipo ISSUE não arquivadas podem receber tentativas de solução',
      );
    }

    const solutionAttempt = technicalEntry.addSolutionAttempt(
      description,
      result,
    );

    await this.solutionAttemptRepository.insert(solutionAttempt);

    return SolutionAttemptOutputMapper.toOutput(solutionAttempt);
  }
}

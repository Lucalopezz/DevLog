import {
  SolutionAttemptOutput,
  SolutionAttemptOutputMapper,
} from '../../dto/solution-attempt/solution-attempt.dto';
import { SolutionAttemptRepository } from '@/technical-entry/domain/repositories/solution-attempt/solution-attempt.repository';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { NotFoundException } from '@nestjs/common';

export type UpdateSolutionAttemptUseCaseInput = {
  userId: string;
  technicalEntryId: string;
  attemptId: string;
  description: string;
};

export type UpdateSolutionAttemptUseCaseOutput = SolutionAttemptOutput;

export class UpdateSolutionAttemptUseCase implements UseCaseContract<
  UpdateSolutionAttemptUseCaseInput,
  UpdateSolutionAttemptUseCaseOutput
> {
  constructor(
    private readonly technicalEntryRepository: TechnicalEntryRepository,
    private readonly solutionAttemptRepository: SolutionAttemptRepository,
  ) {}

  async execute(
    input: UpdateSolutionAttemptUseCaseInput,
  ): Promise<SolutionAttemptOutput> {
    const technicalEntry = await this.technicalEntryRepository.findById(
      input.technicalEntryId,
    );

    if (!technicalEntry || technicalEntry.userId !== input.userId) {
      throw new NotFoundException('Technical entry not found');
    }

    const solutionAttempt = await this.solutionAttemptRepository.findById(
      input.attemptId,
    );

    if (
      !solutionAttempt ||
      solutionAttempt.technicalEntryId !== technicalEntry.id
    ) {
      throw new NotFoundException('Solution attempt not found');
    }

    solutionAttempt.updateDescription(input.description);

    await this.solutionAttemptRepository.update(solutionAttempt);

    return SolutionAttemptOutputMapper.toOutput(solutionAttempt);
  }
}

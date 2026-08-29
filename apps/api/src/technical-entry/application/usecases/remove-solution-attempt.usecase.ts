import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry.repository';
import { SolutionAttemptRepository } from '@/technical-entry/domain/repositories/solution-attempt/solution-attempt.repositoty';

export type RemoveSolutionAttemptUseCaseInput = {
  userId: string;
  technicalEntryId: string;
  attemptId: string;
};

export type RemoveSolutionAttemptUseCaseOutput = void;

export class RemoveSolutionAttemptUseCase implements UseCaseContract<
  RemoveSolutionAttemptUseCaseInput,
  RemoveSolutionAttemptUseCaseOutput
> {
  constructor(
    private readonly technicalEntryRepository: TechnicalEntryRepository,
    private readonly solutionAttemptRepository: SolutionAttemptRepository,
  ) {}

  async execute(input: RemoveSolutionAttemptUseCaseInput): Promise<void> {
    const technicalEntry = await this.technicalEntryRepository.findById(
      input.technicalEntryId,
    );

    if (!technicalEntry || technicalEntry.userId !== input.userId) {
      throw new NotFoundException('Entrada técnica não encontrada');
    }

    const solutionAttempt = await this.solutionAttemptRepository.findById(
      input.attemptId,
    );

    if (
      !solutionAttempt ||
      solutionAttempt.technicalEntryId !== technicalEntry.id
    ) {
      throw new NotFoundException('Tentativa de solução não encontrada');
    }

    await this.solutionAttemptRepository.delete(input.attemptId);
  }
}

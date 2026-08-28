import { SolutionAttemptResult } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt-result.enum';
import { SolutionAttemptEntity } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt.entity';

export type SolutionAttemptOutput = {
  id: string;
  technicalEntryId: string;
  description: string;
  result: SolutionAttemptResult;
  createdAt: Date;
  updatedAt: Date;
};

export class SolutionAttemptOutputMapper {
  static toOutput(
    solutionAttempt: SolutionAttemptEntity,
  ): SolutionAttemptOutput {
    return {
      id: solutionAttempt.id,
      technicalEntryId: solutionAttempt.technicalEntryId,
      description: solutionAttempt.description,
      result: solutionAttempt.result,
      createdAt: solutionAttempt.createdAt,
      updatedAt: solutionAttempt.updatedAt,
    };
  }
}

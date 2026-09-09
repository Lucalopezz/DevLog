import type { UpdateSolutionAttemptUseCaseInput } from '@/technical-entry/application/usecases/solution-attempt/update-solution-attempt.usecase';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSolutionAttemptDto implements Omit<
  UpdateSolutionAttemptUseCaseInput,
  'userId' | 'technicalEntryId' | 'attemptId'
> {
  @IsNotEmpty({ message: 'Attempt description is required' })
  @IsString({ message: 'Attempt description must be a string' })
  description: string;
}

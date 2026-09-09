import type { AddSolutionAttemptUseCaseInput } from '@/technical-entry/application/usecases/solution-attempt/add-solution-attempt.usecase';
import { SolutionAttemptResult } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt-result.enum';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class AddSolutionAttemptDto implements Omit<
  AddSolutionAttemptUseCaseInput,
  'userId' | 'technicalEntryId'
> {
  @IsNotEmpty({ message: 'Attempt description is required' })
  @IsString({ message: 'Attempt description must be a string' })
  description: string;

  @IsNotEmpty({ message: 'Attempt result is required' })
  @IsEnum(SolutionAttemptResult, {
    message: 'Attempt result must be valid',
  })
  result: SolutionAttemptResult;
}

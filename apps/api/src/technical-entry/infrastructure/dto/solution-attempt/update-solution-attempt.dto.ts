import type { UpdateSolutionAttemptUseCaseInput } from '@/technical-entry/application/usecases/solution-attempt/update-solution-attempt.usecase';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSolutionAttemptDto implements Omit<
  UpdateSolutionAttemptUseCaseInput,
  'userId' | 'technicalEntryId' | 'attemptId'
> {
  @IsNotEmpty({ message: 'A descrição da tentativa é obrigatória' })
  @IsString({ message: 'A descrição da tentativa deve ser um texto' })
  description: string;
}

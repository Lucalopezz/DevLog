import type { AddSolutionAttemptUseCaseInput } from '@/technical-entry/application/usecases/add-solution-attempt.usecase';
import { SolutionAttemptResult } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt-result.enum';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class AddSolutionAttemptDto implements Omit<
  AddSolutionAttemptUseCaseInput,
  'userId' | 'technicalEntryId'
> {
  @IsNotEmpty({ message: 'A descrição da tentativa é obrigatória' })
  @IsString({ message: 'A descrição da tentativa deve ser um texto' })
  description: string;

  @IsNotEmpty({ message: 'O resultado da tentativa é obrigatório' })
  @IsEnum(SolutionAttemptResult, {
    message: 'O resultado da tentativa deve ser válido',
  })
  result: SolutionAttemptResult;
}

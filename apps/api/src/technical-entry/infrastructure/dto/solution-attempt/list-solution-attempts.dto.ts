import type { ListSolutionAttemptsUseCaseInput } from '@/technical-entry/application/usecases/solution-attempt/list-solution-attempts.usecase';
import { SolutionAttemptResult } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt-result.enum';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class ListSolutionAttemptsDto implements Omit<
  ListSolutionAttemptsUseCaseInput,
  'userId' | 'technicalEntryId'
> {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Parametro inválido' })
  @Min(1, { message: 'O número da página deve ser maior que zero' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Parametro inválido' })
  @Min(1, { message: 'A quantidade por página deve ser maior que zero' })
  perPage?: number;

  @IsOptional()
  @IsIn(['createdAt', 'result'], { message: 'Parametro inválido' })
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Parametro inválido' })
  sortDir?: 'asc' | 'desc';

  @IsOptional()
  @IsEnum(SolutionAttemptResult, { message: 'Parametro inválido' })
  result?: SolutionAttemptResult;
}

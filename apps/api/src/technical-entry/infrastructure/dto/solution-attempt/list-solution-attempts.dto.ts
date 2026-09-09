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
  @IsInt({ message: 'Invalid parameter' })
  @Min(1, { message: 'Page number must be greater than zero' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Invalid parameter' })
  @Min(1, { message: 'Items per page must be greater than zero' })
  perPage?: number;

  @IsOptional()
  @IsIn(['createdAt', 'result'], { message: 'Invalid parameter' })
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Invalid parameter' })
  sortDir?: 'asc' | 'desc';

  @IsOptional()
  @IsEnum(SolutionAttemptResult, { message: 'Invalid parameter' })
  result?: SolutionAttemptResult;
}

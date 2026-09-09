import type { SearchProjectCommandUseCaseInput } from '@/project/application/usecases/command/search-project-command.usecase';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class SearchProjectCommandDto implements Omit<
  SearchProjectCommandUseCaseInput,
  'userId' | 'projectId'
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
  @IsString({ message: 'Invalid parameter' })
  @MaxLength(120, {
    message: 'Command title must be at most 120 characters long',
  })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Invalid parameter' })
  command?: string;

  @IsOptional()
  @IsString({ message: 'Invalid parameter' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Invalid parameter' })
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Invalid parameter' })
  sortDir?: 'asc' | 'desc';
}

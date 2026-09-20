import type { SearchProjectTechnologyUseCaseInput } from '@/project/application/usecases/technology/search-project-technology.usecase';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class SearchProjectTechnologyDto implements Omit<
  SearchProjectTechnologyUseCaseInput,
  'userId'
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
  @MaxLength(100, {
    message: 'Technology name must be at most 100 characters long',
  })
  name?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId?: string;
}

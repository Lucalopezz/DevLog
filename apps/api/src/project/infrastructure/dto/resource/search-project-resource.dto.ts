import type { SearchProjectResourceUseCaseInput } from '@/project/application/usecases/resource/search-project-resource.usecase';
import { ProjectResourceType } from '@/project/domain/entities/resource/project-resource-type.enum';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class SearchProjectResourceDto implements Omit<
  SearchProjectResourceUseCaseInput,
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
    message: 'Resource label must be at most 120 characters long',
  })
  label?: string;

  @IsOptional()
  @IsString({ message: 'Invalid parameter' })
  url?: string;

  @IsOptional()
  @IsEnum(ProjectResourceType, { message: 'Invalid parameter' })
  type?: ProjectResourceType;

  @IsOptional()
  @IsString({ message: 'Invalid parameter' })
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Invalid parameter' })
  sortDir?: 'asc' | 'desc';
}

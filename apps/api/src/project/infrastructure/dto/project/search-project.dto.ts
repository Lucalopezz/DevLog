import { ProjectFilter } from '@/project/domain/repositories/project/project.repository';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { SearchInput } from '@/shared/application/dtos/search-input';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SearchProjectDto implements Omit<
  SearchInput<ProjectFilter>,
  'filter'
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
  name?: string;

  @IsOptional()
  @IsEnum(ProjectStatusEnum, { message: 'Invalid parameter' })
  status?: ProjectStatusEnum;

  @IsOptional()
  @Transform(({ value }: TransformFnParams) => {
    if (value === 'null') {
      return null;
    }

    return typeof value === 'string' ? new Date(value) : (value as unknown);
  })
  @IsDate({ message: 'Invalid parameter' })
  archivedAt?: Date | null;

  @IsOptional()
  @IsString({ message: 'Invalid parameter' })
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Invalid parameter' })
  sortDir?: 'asc' | 'desc';
}

import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ProjectEnvironmentCategory } from '@/project/domain/entities/environment/project-environment-category.enum';

export class SearchProjectEnvironmentDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Invalid page number' })
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Invalid items per page' })
  @Min(1)
  perPage?: number;

  @IsOptional()
  @IsIn(['name', 'category', 'createdAt', 'updatedAt', 'projectName'])
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';
}

export class SearchOwnerProjectEnvironmentsDto extends SearchProjectEnvironmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(Object.values(ProjectEnvironmentCategory))
  category?: ProjectEnvironmentCategory;

  @IsOptional()
  @IsUUID('4')
  projectId?: string;
}

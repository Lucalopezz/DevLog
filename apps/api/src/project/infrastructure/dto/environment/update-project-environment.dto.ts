import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ProjectEnvironmentCategory } from '@/project/domain/entities/environment/project-environment-category.enum';

export class UpdateProjectEnvironmentDto {
  @Transform((params: TransformFnParams) => {
    const value: unknown = params.value;
    return typeof value === 'string' ? value.trim() : value;
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsString({ message: 'Environment name must be a string' })
  @MinLength(2, {
    message: 'Environment name must be at least 2 characters long',
  })
  @MaxLength(100, {
    message: 'Environment name must be at most 100 characters long',
  })
  name?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(ProjectEnvironmentCategory, {
    message: 'Invalid environment category',
  })
  category?: ProjectEnvironmentCategory;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  operatingSystem?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  runtime?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  runtimeVersion?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;
}

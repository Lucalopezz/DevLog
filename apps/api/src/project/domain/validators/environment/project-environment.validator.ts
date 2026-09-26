import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-fields';
import type { ProjectEnvironmentProps } from '../../entities/environment/project-environment.entity';
import { ProjectEnvironmentCategory } from '../../entities/environment/project-environment-category.enum';

export class ProjectEnvironmentRules {
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId: string;

  @IsString({ message: 'Environment name must be a string' })
  @MinLength(2, {
    message: 'Environment name must be at least 2 characters long',
  })
  @MaxLength(100, {
    message: 'Environment name must be at most 100 characters long',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  normalizedName: string;

  @IsEnum(ProjectEnvironmentCategory, {
    message: 'Invalid environment category',
  })
  category: ProjectEnvironmentCategory;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  operatingSystem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  runtime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  runtimeVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  constructor(props: ProjectEnvironmentProps) {
    Object.assign(this, props);
  }
}

export class ProjectEnvironmentValidator extends ClassValidatorFields<ProjectEnvironmentRules> {
  validate(data: ProjectEnvironmentRules): boolean {
    return super.validate(new ProjectEnvironmentRules(data));
  }
}

export class ProjectEnvironmentValidatorFactory {
  static create(): ProjectEnvironmentValidator {
    return new ProjectEnvironmentValidator();
  }
}

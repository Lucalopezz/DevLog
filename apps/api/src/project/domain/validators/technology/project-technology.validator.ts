import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-fields';
import type { ProjectTechnologyProps } from '../../entities/technology/project-technology.entity';

export class ProjectTechnologyRules {
  @IsString({ message: 'Project ID must be a string' })
  @IsNotEmpty({ message: 'Project ID is required' })
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId: string;

  @IsString({ message: 'Technology name must be a string' })
  @IsNotEmpty({ message: 'Technology name is required' })
  @MaxLength(100, {
    message: 'Technology name must be at most 100 characters long',
  })
  name: string;

  @IsOptional()
  @IsString({ message: 'Technology version must be a string' })
  @MaxLength(50, {
    message: 'Technology version must be at most 50 characters long',
  })
  version?: string;

  @IsDate({ message: 'Creation date must be valid' })
  createdAt: Date;

  @IsDate({ message: 'Update date must be valid' })
  updatedAt: Date;

  constructor({
    projectId,
    name,
    version,
    createdAt,
    updatedAt,
  }: ProjectTechnologyProps) {
    Object.assign(this, {
      projectId,
      name,
      version,
      createdAt,
      updatedAt,
    });
  }
}

export class ProjectTechnologyValidator extends ClassValidatorFields<ProjectTechnologyRules> {
  validate(data: ProjectTechnologyRules): boolean {
    return super.validate(new ProjectTechnologyRules(data));
  }
}

export class ProjectTechnologyValidatorFactory {
  static create(): ProjectTechnologyValidator {
    return new ProjectTechnologyValidator();
  }
}

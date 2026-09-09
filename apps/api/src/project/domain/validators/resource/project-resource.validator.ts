import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-fields';
import type { ProjectResourceProps } from '../../entities/resource/project-resource.entity';
import { ProjectResourceType } from '../../entities/resource/project-resource-type.enum';

export class ProjectResourceRules {
  @IsString({ message: 'Project ID must be a string' })
  @IsNotEmpty({ message: 'Project ID is required' })
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId: string;

  @MaxLength(120, {
    message: 'Resource label must be at most 120 characters long',
  })
  @IsString({ message: 'Resource label must be a string' })
  @IsNotEmpty({ message: 'Resource label is required' })
  label: string;

  @IsUrl(
    { require_protocol: true, require_tld: false },
    { message: 'Resource URL must be valid' },
  )
  @IsString({ message: 'Resource URL must be a string' })
  @IsNotEmpty({ message: 'Resource URL is required' })
  url: string;

  @IsEnum(ProjectResourceType, {
    message: 'Resource type must be valid',
  })
  type: ProjectResourceType;

  @IsDate({ message: 'Creation date must be valid' })
  createdAt: Date;

  @IsDate({ message: 'Update date must be valid' })
  updatedAt: Date;

  constructor({
    projectId,
    label,
    url,
    type,
    createdAt,
    updatedAt,
  }: ProjectResourceProps) {
    Object.assign(this, {
      projectId,
      label,
      url,
      type,
      createdAt,
      updatedAt,
    });
  }
}

export class ProjectResourceValidator extends ClassValidatorFields<ProjectResourceRules> {
  validate(data: ProjectResourceRules): boolean {
    return super.validate(new ProjectResourceRules(data));
  }
}

export class ProjectResourceValidatorFactory {
  static create(): ProjectResourceValidator {
    return new ProjectResourceValidator();
  }
}

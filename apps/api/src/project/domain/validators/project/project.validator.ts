import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-fields';
import type { ProjectProps } from '../../entities/project/project.entity';
import { ProjectStatusEnum } from '../../entities/project/project-status-enum';

export class ProjectRules {
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID is required' })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId: string;

  @MaxLength(150, {
    message: 'Project name must be at most 150 characters long',
  })
  @IsString({ message: 'Project name must be a string' })
  @IsNotEmpty({ message: 'Project name is required' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Project description must be a string' })
  description?: string;

  @IsEnum(ProjectStatusEnum, {
    message: 'Project status must be valid',
  })
  status: ProjectStatusEnum;

  @IsOptional()
  @IsString({ message: 'Local path must be a string' })
  localPath?: string;

  @IsOptional()
  @IsDate({ message: 'Archive date must be valid' })
  archivedAt?: Date;

  @IsDate({ message: 'Creation date must be valid' })
  createdAt: Date;

  @IsDate({ message: 'Update date must be valid' })
  updatedAt: Date;

  constructor({
    userId,
    name,
    description,
    status,
    localPath,
    archivedAt,
    createdAt,
    updatedAt,
  }: ProjectProps) {
    Object.assign(this, {
      userId,
      name,
      description,
      status,
      localPath,
      archivedAt,
      createdAt,
      updatedAt,
    });
  }
}

export class ProjectValidator extends ClassValidatorFields<ProjectRules> {
  validate(data: ProjectRules): boolean {
    return super.validate(new ProjectRules(data));
  }
}

export class ProjectValidatorFactory {
  static create(): ProjectValidator {
    return new ProjectValidator();
  }
}

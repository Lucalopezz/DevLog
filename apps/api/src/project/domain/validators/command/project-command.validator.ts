import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-fields';
import type { ProjectCommandProps } from '../../entities/command/project-command.entity';

export class ProjectCommandRules {
  @IsString({ message: 'Project ID must be a string' })
  @IsNotEmpty({ message: 'Project ID is required' })
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId: string;

  @MaxLength(120, {
    message: 'Command title must be at most 120 characters long',
  })
  @IsString({ message: 'Command title must be a string' })
  @IsNotEmpty({ message: 'Command title is required' })
  title: string;

  @IsString({ message: 'Command must be a string' })
  @IsNotEmpty({ message: 'Command is required' })
  command: string;

  @IsOptional()
  @IsString({ message: 'Command description must be a string' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'Execution order must be an integer' })
  @Min(0, { message: 'Execution order must be greater than or equal to zero' })
  executionOrder?: number;

  @IsDate({ message: 'Creation date must be valid' })
  createdAt: Date;

  @IsDate({ message: 'Update date must be valid' })
  updatedAt: Date;

  constructor({
    projectId,
    title,
    command,
    description,
    executionOrder,
    createdAt,
    updatedAt,
  }: ProjectCommandProps) {
    Object.assign(this, {
      projectId,
      title,
      command,
      description,
      executionOrder,
      createdAt,
      updatedAt,
    });
  }
}

export class ProjectCommandValidator extends ClassValidatorFields<ProjectCommandRules> {
  validate(data: ProjectCommandRules): boolean {
    return super.validate(new ProjectCommandRules(data));
  }
}

export class ProjectCommandValidatorFactory {
  static create(): ProjectCommandValidator {
    return new ProjectCommandValidator();
  }
}

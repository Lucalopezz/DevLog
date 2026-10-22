import {
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-fields';
import type { ProjectTodoProps } from '../../entities/todo/project-todo.entity';

export class ProjectTodoRules {
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId: string;

  @IsString({ message: 'Todo title must be a string' })
  @MinLength(1, { message: 'Todo title must not be empty' })
  @MaxLength(200, { message: 'Todo title must be at most 200 characters long' })
  title: string;

  @IsOptional()
  @IsDate()
  completedAt?: Date;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  constructor(props: ProjectTodoProps) {
    Object.assign(this, props);
  }
}

export class ProjectTodoValidator extends ClassValidatorFields<ProjectTodoRules> {
  validate(data: ProjectTodoRules): boolean {
    return super.validate(new ProjectTodoRules(data));
  }
}

export class ProjectTodoValidatorFactory {
  static create(): ProjectTodoValidator {
    return new ProjectTodoValidator();
  }
}

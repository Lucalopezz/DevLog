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
import type { ProjectCommandProps } from '../entities/project-command.entity';

export class ProjectCommandRules {
  @IsString({ message: 'O ID do projeto deve ser um texto' })
  @IsNotEmpty({ message: 'O ID do projeto é obrigatório' })
  @IsUUID('4', { message: 'O ID do projeto deve ser um UUID válido' })
  projectId: string;

  @MaxLength(120, {
    message: 'O título do comando deve ter no máximo 120 caracteres',
  })
  @IsString({ message: 'O título do comando deve ser um texto' })
  @IsNotEmpty({ message: 'O título do comando é obrigatório' })
  title: string;

  @IsString({ message: 'O comando deve ser um texto' })
  @IsNotEmpty({ message: 'O comando é obrigatório' })
  command: string;

  @IsOptional()
  @IsString({ message: 'A descrição do comando deve ser um texto' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'A ordem de execução deve ser um número inteiro' })
  @Min(0, { message: 'A ordem de execução deve ser maior ou igual a zero' })
  executionOrder?: number;

  @IsDate({ message: 'A data de criação deve ser válida' })
  createdAt: Date;

  @IsDate({ message: 'A data de atualização deve ser válida' })
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

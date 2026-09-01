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
  @IsString({ message: 'O ID do projeto deve ser um texto' })
  @IsNotEmpty({ message: 'O ID do projeto é obrigatório' })
  @IsUUID('4', { message: 'O ID do projeto deve ser um UUID válido' })
  projectId: string;

  @IsString({ message: 'O nome da tecnologia deve ser um texto' })
  @IsNotEmpty({ message: 'O nome da tecnologia é obrigatório' })
  @MaxLength(100, {
    message: 'O nome da tecnologia deve ter no máximo 100 caracteres',
  })
  name: string;

  @IsOptional()
  @IsString({ message: 'A versão da tecnologia deve ser um texto' })
  @MaxLength(50, {
    message: 'A versão da tecnologia deve ter no máximo 50 caracteres',
  })
  version?: string;

  @IsDate({ message: 'A data de criação deve ser válida' })
  createdAt: Date;

  @IsDate({ message: 'A data de atualização deve ser válida' })
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

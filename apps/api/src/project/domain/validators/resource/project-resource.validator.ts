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
  @IsString({ message: 'O ID do projeto deve ser um texto' })
  @IsNotEmpty({ message: 'O ID do projeto é obrigatório' })
  @IsUUID('4', { message: 'O ID do projeto deve ser um UUID válido' })
  projectId: string;

  @MaxLength(120, {
    message: 'O rótulo do recurso deve ter no máximo 120 caracteres',
  })
  @IsString({ message: 'O rótulo do recurso deve ser um texto' })
  @IsNotEmpty({ message: 'O rótulo do recurso é obrigatório' })
  label: string;

  @IsUrl(
    { require_protocol: true, require_tld: false },
    { message: 'A URL do recurso deve ser válida' },
  )
  @IsString({ message: 'A URL do recurso deve ser um texto' })
  @IsNotEmpty({ message: 'A URL do recurso é obrigatória' })
  url: string;

  @IsEnum(ProjectResourceType, {
    message: 'O tipo do recurso deve ser válido',
  })
  type: ProjectResourceType;

  @IsDate({ message: 'A data de criação deve ser válida' })
  createdAt: Date;

  @IsDate({ message: 'A data de atualização deve ser válida' })
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

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
  @IsString({ message: 'O ID do usuário deve ser um texto' })
  @IsNotEmpty({ message: 'O ID do usuário é obrigatório' })
  @IsUUID('4', { message: 'O ID do usuário deve ser um UUID válido' })
  userId: string;

  @MaxLength(150, {
    message: 'O nome do projeto deve ter no máximo 150 caracteres',
  })
  @IsString({ message: 'O nome do projeto deve ser um texto' })
  @IsNotEmpty({ message: 'O nome do projeto é obrigatório' })
  name: string;

  @IsOptional()
  @IsString({ message: 'A descrição do projeto deve ser um texto' })
  description?: string;

  @IsEnum(ProjectStatusEnum, {
    message: 'O status do projeto deve ser válido',
  })
  status: ProjectStatusEnum;

  @IsOptional()
  @IsString({ message: 'O caminho local deve ser um texto' })
  localPath?: string;

  @IsOptional()
  @IsDate({ message: 'A data de arquivamento deve ser válida' })
  archivedAt?: Date;

  @IsDate({ message: 'A data de criação deve ser válida' })
  createdAt: Date;

  @IsDate({ message: 'A data de atualização deve ser válida' })
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

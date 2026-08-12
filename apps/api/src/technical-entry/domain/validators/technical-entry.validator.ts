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
import type { TechnicalEntryProps } from '../entities/technical-entry.entity';
import { TechnicalEntryType } from '../entities/technical-entry-type.enum';

export class TechnicalEntryRules {
  @IsString({ message: 'O ID do usuário deve ser um texto' })
  @IsNotEmpty({ message: 'O ID do usuário é obrigatório' })
  @IsUUID('4', { message: 'O ID do usuário deve ser um UUID válido' })
  userId: string;

  @IsOptional()
  @IsString({ message: 'O ID do projeto deve ser um texto' })
  @IsUUID('4', { message: 'O ID do projeto deve ser um UUID válido' })
  projectId?: string;

  @MaxLength(200, {
    message: 'O título deve ter no máximo 200 caracteres',
  })
  @IsString({ message: 'O título deve ser um texto' })
  @IsNotEmpty({ message: 'O título é obrigatório' })
  title: string;

  @IsString({ message: 'O contexto deve ser um texto' })
  @IsNotEmpty({ message: 'O contexto é obrigatório' })
  context: string;

  @IsOptional()
  @IsString({ message: 'A conclusão deve ser um texto' })
  conclusion?: string;

  @IsEnum(TechnicalEntryType, {
    message: 'O tipo da entrada técnica deve ser válido',
  })
  type: TechnicalEntryType;

  @IsDate({ message: 'A data de resolução deve ser válida' })
  @IsOptional()
  resolvedAt?: Date;

  @IsOptional()
  @IsDate({ message: 'A data de arquivamento deve ser válida' })
  archivedAt?: Date;

  @IsDate({ message: 'A data de criação deve ser válida' })
  createdAt: Date;

  @IsDate({ message: 'A data de atualização deve ser válida' })
  updatedAt: Date;

  constructor({
    userId,
    projectId,
    title,
    context,
    conclusion,
    type,
    resolvedAt,
    archivedAt,
    createdAt,
    updatedAt,
  }: TechnicalEntryProps) {
    Object.assign(this, {
      userId,
      projectId,
      title,
      context,
      conclusion,
      type,
      resolvedAt,
      archivedAt,
      createdAt,
      updatedAt,
    });
  }
}

export class TechnicalEntryValidator extends ClassValidatorFields<TechnicalEntryRules> {
  validate(data: TechnicalEntryRules): boolean {
    return super.validate(new TechnicalEntryRules(data));
  }
}

export class TechnicalEntryValidatorFactory {
  static create(): TechnicalEntryValidator {
    return new TechnicalEntryValidator();
  }
}

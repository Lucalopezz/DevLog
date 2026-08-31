import { UpdateTechnicalEntryUseCaseInput } from '@/technical-entry/application/usecases/update-technical-entry.usecase';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateTechnicalEntryDto implements Omit<
  UpdateTechnicalEntryUseCaseInput,
  'id' | 'userId'
> {
  // ValidateIf diferencia ausência de null: o campo pode ser omitido, mas null
  // não é aceito onde o contrato exige uma string.
  @ValidateIf((_, value) => value !== undefined)
  @IsString({ message: 'Parametro inválido' })
  @MinLength(3, { message: 'O título deve ter no mínimo 3 caracteres' })
  @MaxLength(200, {
    message: 'O título deve ter no máximo 200 caracteres',
  })
  title?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString({ message: 'Parametro inválido' })
  @MinLength(3, { message: 'O contexto deve ter no mínimo 3 caracteres' })
  context?: string;

  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  conclusion?: string | null;

  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  @IsUUID('4', { message: 'Parametro inválido' })
  projectId?: string | null;
}

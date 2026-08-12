import { UpdateTechnicalEntryUseCaseInput } from '@/technical-entry/application/usecases/update-technical-entry.usecase';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateTechnicalEntryDto implements Omit<
  UpdateTechnicalEntryUseCaseInput,
  'id' | 'userId'
> {
  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  @MinLength(3, { message: 'O título deve ter no mínimo 3 caracteres' })
  @MaxLength(200, {
    message: 'O título deve ter no máximo 200 caracteres',
  })
  title?: string;

  @IsOptional()
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

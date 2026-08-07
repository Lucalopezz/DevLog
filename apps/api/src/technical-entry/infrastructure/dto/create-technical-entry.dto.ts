import { CreateTechnicalEntryUseCaseInput } from '@/technical-entry/application/usecases/create-technical-entry.usecase';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateTechnicalEntryDto implements Omit<
  CreateTechnicalEntryUseCaseInput,
  'userId'
> {
  @IsNotEmpty({ message: 'O título é obrigatório' })
  @IsString({ message: 'Parametro inválido' })
  @MinLength(3, { message: 'O título deve ter no mínimo 3 caracteres' })
  title: string;

  @IsNotEmpty({ message: 'O contexto é obrigatório' })
  @IsString({ message: 'Parametro inválido' })
  @MinLength(3, { message: 'O contexto deve ter no mínimo 3 caracteres' })
  context: string;

  @IsEnum(TechnicalEntryType, { message: 'Parametro inválido' })
  @IsNotEmpty({ message: 'O tipo é obrigatório' })
  type: TechnicalEntryType;

  @IsString({ message: 'Parametro inválido' })
  @IsOptional()
  conclusion?: string | undefined;
}

import { UpdateTechnicalEntryUseCaseInput } from '@/technical-entry/application/usecases/update-technical-entry.usecase';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateTechnicalEntryDto implements Omit<
  UpdateTechnicalEntryUseCaseInput,
  'id' | 'userId'
> {
  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  @MinLength(3, { message: 'O título deve ter no mínimo 3 caracteres' })
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
  projectId?: string | null;
}

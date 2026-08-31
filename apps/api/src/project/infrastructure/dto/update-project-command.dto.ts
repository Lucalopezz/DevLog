import type { UpdateProjectCommandUseCaseInput } from '@/project/application/usecases/update-project-command.usecase';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateProjectCommandDto implements Omit<
  UpdateProjectCommandUseCaseInput,
  'userId' | 'projectId' | 'commandId'
> {
  // ValidateIf permite omitir o campo no PATCH, mas ainda encaminha null aos
  // validadores dos campos que não podem ser removidos.
  @ValidateIf((_, value) => value !== undefined)
  @IsNotEmpty({ message: 'O título do comando é obrigatório' })
  @IsString({ message: 'O título do comando deve ser um texto' })
  @MaxLength(120, {
    message: 'O título do comando deve ter no máximo 120 caracteres',
  })
  title?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsNotEmpty({ message: 'O comando é obrigatório' })
  @IsString({ message: 'O comando deve ser um texto' })
  command?: string;

  @IsOptional()
  @IsString({ message: 'A descrição do comando deve ser um texto' })
  description?: string | null;

  @IsOptional()
  @IsInt({ message: 'A ordem de execução deve ser um número inteiro' })
  @Min(0, { message: 'A ordem de execução deve ser maior ou igual a zero' })
  executionOrder?: number | null;
}

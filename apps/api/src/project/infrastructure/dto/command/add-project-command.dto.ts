import type { AddProjectCommandUseCaseInput } from '@/project/application/usecases/command/add-project-command.usecase';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class AddProjectCommandDto implements Omit<
  AddProjectCommandUseCaseInput,
  'userId' | 'projectId'
> {
  @IsNotEmpty({ message: 'O título do comando é obrigatório' })
  @IsString({ message: 'O título do comando deve ser um texto' })
  @MaxLength(120, {
    message: 'O título do comando deve ter no máximo 120 caracteres',
  })
  title: string;

  @IsNotEmpty({ message: 'O comando é obrigatório' })
  @IsString({ message: 'O comando deve ser um texto' })
  command: string;

  @IsOptional()
  @IsString({ message: 'A descrição do comando deve ser um texto' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'A ordem de execução deve ser um número inteiro' })
  @Min(0, { message: 'A ordem de execução deve ser maior ou igual a zero' })
  executionOrder?: number;
}

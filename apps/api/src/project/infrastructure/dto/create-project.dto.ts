import { CreateProjectUseCaseInput } from '@/project/application/usecases/create-project.usecase';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProjectDto implements Omit<
  CreateProjectUseCaseInput,
  'userId'
> {
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString({ message: 'Parametro inválido' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres' })
  @MaxLength(150, {
    message: 'O nome deve ter no máximo 150 caracteres',
  })
  name: string;

  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  description?: string;
}

import type { AddProjectTechnologyUseCaseInput } from '@/project/application/usecases/technology/add-project-technology.usecase';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddProjectTechnologyDto implements Omit<
  AddProjectTechnologyUseCaseInput,
  'userId' | 'projectId'
> {
  @IsNotEmpty({ message: 'O nome da tecnologia é obrigatório' })
  @IsString({ message: 'O nome da tecnologia deve ser um texto' })
  @MaxLength(100, {
    message: 'O nome da tecnologia deve ter no máximo 100 caracteres',
  })
  name: string;

  @IsOptional()
  @IsString({ message: 'A versão da tecnologia deve ser um texto' })
  @MaxLength(50, {
    message: 'A versão da tecnologia deve ter no máximo 50 caracteres',
  })
  version?: string;
}

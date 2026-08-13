import { CreateTagUseCaseInput } from '@/tag/application/usecases/create-tag.usecase';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTagDto implements Omit<CreateTagUseCaseInput, 'userId'> {
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString({ message: 'Parametro inválido' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres' })
  @MaxLength(80, {
    message: 'O nome deve ter no máximo 80 caracteres',
  })
  name: string;
}

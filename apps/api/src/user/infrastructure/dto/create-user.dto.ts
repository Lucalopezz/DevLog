import { CreateUserUseCaseInput } from '@/user/application/usecases/create-user.usecase';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto implements CreateUserUseCaseInput {
  @IsString({ message: 'Parametro inválido' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres' })
  name: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'O email é obrigatório' })
  email: string;

  @IsString({ message: 'Parametro inválido' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;

  @IsString({ message: 'Parametro inválido' })
  @IsNotEmpty({ message: 'A confirmação de senha é obrigatória' })
  confirmPassword: string;
}

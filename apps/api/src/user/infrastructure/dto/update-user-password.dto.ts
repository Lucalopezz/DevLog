import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UpdateUserPasswordUseCaseInput } from '@/user/application/usecases/update-user-password.usecase';

export class UpdateUserPasswordDto implements Omit<
  UpdateUserPasswordUseCaseInput,
  'id'
> {
  @IsString({ message: 'Parametro inválido' })
  @IsNotEmpty({ message: 'A senha atual é obrigatória' })
  @IsOptional()
  currentPassword?: string;

  @IsString({ message: 'Parametro inválido' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;

  @IsString({ message: 'Parametro inválido' })
  @IsNotEmpty({ message: 'A confirmação de senha é obrigatória' })
  confirmPassword: string;
}

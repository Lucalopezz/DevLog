import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { UserProps } from '../entities/user.entity';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-fields';

export class UserRules {
  @MaxLength(120, {
    message: 'O nome deve ter no máximo 120 caracteres',
  })
  @IsString({ message: 'O nome deve ser um texto' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name: string;

  @MaxLength(255, {
    message: 'O e-mail deve ter no máximo 255 caracteres',
  })
  @IsEmail({}, { message: 'O e-mail deve ser válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string;

  @MaxLength(255, {
    message: 'A senha deve ter no máximo 255 caracteres',
  })
  @IsString({ message: 'A senha deve ser um texto' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  password: string;

  @IsDate({ message: 'A data de criação deve ser válida' })
  createdAt: Date;

  @IsDate({ message: 'A data de atualização deve ser válida' })
  updatedAt: Date;

  constructor({ name, email, password, createdAt, updatedAt }: UserProps) {
    Object.assign(this, { name, email, password, createdAt, updatedAt });
  }
}

export class UserValidator extends ClassValidatorFields<UserRules> {
  validate(data: UserRules): boolean {
    return super.validate(new UserRules(data));
  }
}

export class UserValidatorFactory {
  static create(): UserValidator {
    return new UserValidator();
  }
}

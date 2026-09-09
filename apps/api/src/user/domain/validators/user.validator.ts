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
    message: 'Name must be at most 120 characters long',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @MaxLength(255, {
    message: 'Email must be at most 255 characters long',
  })
  @IsEmail({}, { message: 'Email must be valid' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @MaxLength(255, {
    message: 'Password must be at most 255 characters long',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsDate({ message: 'Creation date must be valid' })
  createdAt: Date;

  @IsDate({ message: 'Update date must be valid' })
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

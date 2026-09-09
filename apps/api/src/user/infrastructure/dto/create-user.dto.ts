import { CreateUserUseCaseInput } from '@/user/application/usecases/create-user.usecase';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto implements CreateUserUseCaseInput {
  @IsString({ message: 'Invalid parameter' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  name: string;

  @IsEmail({}, { message: 'Invalid email' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Invalid parameter' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString({ message: 'Invalid parameter' })
  @IsNotEmpty({ message: 'Password confirmation is required' })
  confirmPassword: string;
}

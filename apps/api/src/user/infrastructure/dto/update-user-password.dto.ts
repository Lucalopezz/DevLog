import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UpdateUserPasswordUseCaseInput } from '@/user/application/usecases/update-user-password.usecase';

export class UpdateUserPasswordDto implements Omit<
  UpdateUserPasswordUseCaseInput,
  'userId'
> {
  @IsString({ message: 'Invalid parameter' })
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @IsString({ message: 'Invalid parameter' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString({ message: 'Invalid parameter' })
  @IsNotEmpty({ message: 'Password confirmation is required' })
  confirmPassword: string;
}

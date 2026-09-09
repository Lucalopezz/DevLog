import { CreateProjectUseCaseInput } from '@/project/application/usecases/project/create-project.usecase';
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
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Invalid parameter' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(150, {
    message: 'Name must be at most 150 characters long',
  })
  name: string;

  @IsOptional()
  @IsString({ message: 'Invalid parameter' })
  description?: string;
}

import { CreateTagUseCaseInput } from '@/tag/application/usecases/create-tag.usecase';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTagDto implements Omit<CreateTagUseCaseInput, 'userId'> {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Invalid parameter' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(80, {
    message: 'Name must be at most 80 characters long',
  })
  name: string;
}

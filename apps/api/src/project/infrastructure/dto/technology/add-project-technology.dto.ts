import type { AddProjectTechnologyUseCaseInput } from '@/project/application/usecases/technology/add-project-technology.usecase';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddProjectTechnologyDto implements Omit<
  AddProjectTechnologyUseCaseInput,
  'userId' | 'projectId'
> {
  @IsNotEmpty({ message: 'Technology name is required' })
  @IsString({ message: 'Technology name must be a string' })
  @MaxLength(100, {
    message: 'Technology name must be at most 100 characters long',
  })
  name: string;

  @IsOptional()
  @IsString({ message: 'Technology version must be a string' })
  @MaxLength(50, {
    message: 'Technology version must be at most 50 characters long',
  })
  version?: string;
}

import type { AddProjectCommandUseCaseInput } from '@/project/application/usecases/command/add-project-command.usecase';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class AddProjectCommandDto implements Omit<
  AddProjectCommandUseCaseInput,
  'userId' | 'projectId'
> {
  @IsNotEmpty({ message: 'Command title is required' })
  @IsString({ message: 'Command title must be a string' })
  @MaxLength(120, {
    message: 'Command title must be at most 120 characters long',
  })
  title: string;

  @IsNotEmpty({ message: 'Command is required' })
  @IsString({ message: 'Command must be a string' })
  command: string;

  @IsOptional()
  @IsString({ message: 'Command description must be a string' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'Execution order must be an integer' })
  @Min(0, { message: 'Execution order must be greater than or equal to zero' })
  executionOrder?: number;
}

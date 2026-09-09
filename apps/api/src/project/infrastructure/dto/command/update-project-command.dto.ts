import type { UpdateProjectCommandUseCaseInput } from '@/project/application/usecases/command/update-project-command.usecase';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateProjectCommandDto implements Omit<
  UpdateProjectCommandUseCaseInput,
  'userId' | 'projectId' | 'commandId'
> {
  // ValidateIf allows omission in PATCH but still passes null to
  // validators for fields that cannot be cleared.
  @ValidateIf((_, value) => value !== undefined)
  @IsNotEmpty({ message: 'Command title is required' })
  @IsString({ message: 'Command title must be a string' })
  @MaxLength(120, {
    message: 'Command title must be at most 120 characters long',
  })
  title?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsNotEmpty({ message: 'Command is required' })
  @IsString({ message: 'Command must be a string' })
  command?: string;

  @IsOptional()
  @IsString({ message: 'Command description must be a string' })
  description?: string | null;

  @IsOptional()
  @IsInt({ message: 'Execution order must be an integer' })
  @Min(0, { message: 'Execution order must be greater than or equal to zero' })
  executionOrder?: number | null;
}

import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import type { UpdateProjectUseCaseInput } from '@/project/application/usecases/project/update-project.usecase';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateProjectDto implements Omit<
  UpdateProjectUseCaseInput,
  'id' | 'userId'
> {
  // ValidateIf skips only omitted fields. Unlike IsOptional, it does not
  // skip null, so non-nullable fields are still validated.
  @ValidateIf((_, value) => value !== undefined)
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Invalid parameter' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(150, {
    message: 'Name must be at most 150 characters long',
  })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Invalid parameter' })
  description?: string | null;

  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(ProjectStatusEnum, { message: 'Invalid parameter' })
  status?: ProjectStatusEnum;

  @IsOptional()
  @IsString({ message: 'Invalid parameter' })
  localPath?: string | null;
}

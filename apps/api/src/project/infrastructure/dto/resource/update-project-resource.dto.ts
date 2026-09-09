import type { UpdateProjectResourceUseCaseInput } from '@/project/application/usecases/resource/update-project-resource.usecase';
import { ProjectResourceType } from '@/project/domain/entities/resource/project-resource-type.enum';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateProjectResourceDto implements Omit<
  UpdateProjectResourceUseCaseInput,
  'userId' | 'projectId' | 'resourceId'
> {
  @ValidateIf((_, value) => value !== undefined)
  @IsNotEmpty({ message: 'Resource label is required' })
  @IsString({ message: 'Resource label must be a string' })
  @MaxLength(120, {
    message: 'Resource label must be at most 120 characters long',
  })
  label?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsUrl(
    { require_protocol: true, require_tld: false },
    { message: 'Resource URL must be valid' },
  )
  @IsString({ message: 'Resource URL must be a string' })
  @IsNotEmpty({ message: 'Resource URL is required' })
  url?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(ProjectResourceType, {
    message: 'Resource type must be valid',
  })
  type?: ProjectResourceType;
}

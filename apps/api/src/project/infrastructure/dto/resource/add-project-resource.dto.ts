import type { AddProjectResourceUseCaseInput } from '@/project/application/usecases/resource/add-project-resource.usecase';
import { ProjectResourceType } from '@/project/domain/entities/resource/project-resource-type.enum';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class AddProjectResourceDto implements Omit<
  AddProjectResourceUseCaseInput,
  'userId' | 'projectId'
> {
  @IsNotEmpty({ message: 'Resource label is required' })
  @IsString({ message: 'Resource label must be a string' })
  @MaxLength(120, {
    message: 'Resource label must be at most 120 characters long',
  })
  label: string;

  @IsUrl(
    { require_protocol: true, require_tld: false },
    { message: 'Resource URL must be valid' },
  )
  @IsString({ message: 'Resource URL must be a string' })
  @IsNotEmpty({ message: 'Resource URL is required' })
  url: string;

  @IsOptional()
  @IsEnum(ProjectResourceType, {
    message: 'Resource type must be valid',
  })
  type?: ProjectResourceType;
}

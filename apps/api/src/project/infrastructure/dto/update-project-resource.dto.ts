import type { UpdateProjectResourceUseCaseInput } from '@/project/application/usecases/update-project-resource.usecase';
import { ProjectResourceType } from '@/project/domain/entities/project-resource-type.enum';
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
  @IsNotEmpty({ message: 'O rótulo do recurso é obrigatório' })
  @IsString({ message: 'O rótulo do recurso deve ser um texto' })
  @MaxLength(120, {
    message: 'O rótulo do recurso deve ter no máximo 120 caracteres',
  })
  label?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsUrl(
    { require_protocol: true, require_tld: false },
    { message: 'A URL do recurso deve ser válida' },
  )
  @IsString({ message: 'A URL do recurso deve ser um texto' })
  @IsNotEmpty({ message: 'A URL do recurso é obrigatória' })
  url?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(ProjectResourceType, {
    message: 'O tipo do recurso deve ser válido',
  })
  type?: ProjectResourceType;
}

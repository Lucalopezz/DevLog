import type { AddProjectResourceUseCaseInput } from '@/project/application/usecases/add-project-resource.usecase';
import { ProjectResourceType } from '@/project/domain/entities/project-resource-type.enum';
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
  @IsNotEmpty({ message: 'O rótulo do recurso é obrigatório' })
  @IsString({ message: 'O rótulo do recurso deve ser um texto' })
  @MaxLength(120, {
    message: 'O rótulo do recurso deve ter no máximo 120 caracteres',
  })
  label: string;

  @IsUrl(
    { require_protocol: true, require_tld: false },
    { message: 'A URL do recurso deve ser válida' },
  )
  @IsString({ message: 'A URL do recurso deve ser um texto' })
  @IsNotEmpty({ message: 'A URL do recurso é obrigatória' })
  url: string;

  @IsOptional()
  @IsEnum(ProjectResourceType, {
    message: 'O tipo do recurso deve ser válido',
  })
  type?: ProjectResourceType;
}

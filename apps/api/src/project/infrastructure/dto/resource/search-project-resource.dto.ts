import type { SearchProjectResourceUseCaseInput } from '@/project/application/usecases/resource/search-project-resource.usecase';
import { ProjectResourceType } from '@/project/domain/entities/resource/project-resource-type.enum';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class SearchProjectResourceDto implements Omit<
  SearchProjectResourceUseCaseInput,
  'userId' | 'projectId'
> {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Parametro inválido' })
  @Min(1, { message: 'O número da página deve ser maior que zero' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Parametro inválido' })
  @Min(1, { message: 'A quantidade por página deve ser maior que zero' })
  perPage?: number;

  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  @MaxLength(120, {
    message: 'O rótulo do recurso deve ter no máximo 120 caracteres',
  })
  label?: string;

  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  url?: string;

  @IsOptional()
  @IsEnum(ProjectResourceType, { message: 'Parametro inválido' })
  type?: ProjectResourceType;

  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Parametro inválido' })
  sortDir?: 'asc' | 'desc';
}

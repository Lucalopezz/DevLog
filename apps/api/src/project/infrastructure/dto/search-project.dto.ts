import { ProjectFilter } from '@/project/domain/repositories/project.repository';
import { ProjectStatusEnum } from '@/project/domain/entities/project-status-enum';
import { SearchInput } from '@/shared/application/dtos/search-input';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SearchProjectDto implements Omit<
  SearchInput<ProjectFilter>,
  'filter'
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
  name?: string;

  @IsOptional()
  @IsEnum(ProjectStatusEnum, { message: 'Parametro inválido' })
  status?: ProjectStatusEnum;

  @IsOptional()
  @Transform(({ value }: TransformFnParams) => {
    if (value === 'null') {
      return null;
    }

    return typeof value === 'string' ? new Date(value) : (value as unknown);
  })
  @IsDate({ message: 'Parametro inválido' })
  archivedAt?: Date | null;

  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Parametro inválido' })
  sortDir?: 'asc' | 'desc';
}

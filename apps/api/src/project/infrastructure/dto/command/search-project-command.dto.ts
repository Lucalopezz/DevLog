import type { SearchProjectCommandUseCaseInput } from '@/project/application/usecases/command/search-project-command.usecase';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class SearchProjectCommandDto implements Omit<
  SearchProjectCommandUseCaseInput,
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
    message: 'O título do comando deve ter no máximo 120 caracteres',
  })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  command?: string;

  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Parametro inválido' })
  sortDir?: 'asc' | 'desc';
}

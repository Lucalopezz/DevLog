import { SearchTagUseCaseInput } from '@/tag/application/usecases/search-tag.usecase';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class SearchTagDto implements Omit<SearchTagUseCaseInput, 'userId'> {
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
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Parametro inválido' })
  sortDir?: 'asc' | 'desc';

  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  @MaxLength(80, {
    message: 'O nome deve ter no máximo 80 caracteres',
  })
  name?: string;
}

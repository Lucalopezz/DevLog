import { SearchTechnicalEntryUseCaseInput } from '@/technical-entry/application/usecases/search-technical-entry.usecase';
import { TechnicalEntryStatus } from '@/technical-entry/domain/entities/technical-entry-status.enum';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class SearchTechnicalEntryDto implements Omit<
  SearchTechnicalEntryUseCaseInput,
  'userId'
> {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Parametro inválido' })
  @Min(1, { message: 'O número da página deve ser maior que zero' })
  page?: number | undefined;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Parametro inválido' })
  @Min(1, { message: 'A quantidade por página deve ser maior que zero' })
  perPage?: number | undefined;

  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  sort?: string | undefined;

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Parametro inválido' })
  sortDir?: 'asc' | 'desc' | undefined;

  @IsOptional()
  @Transform(({ value }: TransformFnParams) => {
    if (value === 'null') {
      return null;
    }

    return typeof value === 'string' ? new Date(value) : (value as unknown);
  })
  @IsDate({ message: 'Parametro inválido' })
  archivedAt?: Date | null | undefined;

  @IsOptional()
  @IsEnum(TechnicalEntryType, { message: 'Parametro inválido' })
  type?: TechnicalEntryType | undefined;

  @IsOptional()
  @IsEnum(TechnicalEntryStatus, { message: 'Parametro inválido' })
  status?: TechnicalEntryStatus | undefined;

  @IsOptional()
  @IsUUID('4', { message: 'Parametro inválido' })
  projectId?: string | undefined;

  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  title?: string | undefined;
}

import { SearchTechnicalEntryUseCaseInput } from '@/technical-entry/application/usecases/technical-entry/search-technical-entry.usecase';
import { TechnicalEntryStatus } from '@/technical-entry/domain/entities/technical-entry/technical-entry-status.enum';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry/technical-entry-type.enum';
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
  @IsInt({ message: 'Invalid parameter' })
  @Min(1, { message: 'Page number must be greater than zero' })
  page?: number | undefined;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Invalid parameter' })
  @Min(1, { message: 'Items per page must be greater than zero' })
  perPage?: number | undefined;

  @IsOptional()
  @IsString({ message: 'Invalid parameter' })
  sort?: string | undefined;

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Invalid parameter' })
  sortDir?: 'asc' | 'desc' | undefined;

  @IsOptional()
  @Transform(({ value }: TransformFnParams) => {
    if (value === 'null') {
      return null;
    }

    return typeof value === 'string' ? new Date(value) : (value as unknown);
  })
  @IsDate({ message: 'Invalid parameter' })
  archivedAt?: Date | null | undefined;

  @IsOptional()
  @IsEnum(TechnicalEntryType, { message: 'Invalid parameter' })
  type?: TechnicalEntryType | undefined;

  @IsOptional()
  @IsEnum(TechnicalEntryStatus, { message: 'Invalid parameter' })
  status?: TechnicalEntryStatus | undefined;

  @IsOptional()
  @IsUUID('4', { message: 'Invalid parameter' })
  projectId?: string | undefined;

  @IsOptional()
  @IsString({ message: 'Invalid parameter' })
  title?: string | undefined;
}

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
  @IsInt({ message: 'Invalid parameter' })
  @Min(1, { message: 'Page number must be greater than zero' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Invalid parameter' })
  @Min(1, { message: 'Items per page must be greater than zero' })
  perPage?: number;

  @IsOptional()
  @IsString({ message: 'Invalid parameter' })
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Invalid parameter' })
  sortDir?: 'asc' | 'desc';

  @IsOptional()
  @IsString({ message: 'Invalid parameter' })
  @MaxLength(80, {
    message: 'Name must be at most 80 characters long',
  })
  name?: string;
}

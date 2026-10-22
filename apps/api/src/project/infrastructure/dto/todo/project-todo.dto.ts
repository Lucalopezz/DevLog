import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const trimTitle = (params: TransformFnParams): unknown => {
  const value: unknown = params.value;
  return typeof value === 'string' ? value.trim() : value;
};

export class AddProjectTodoDto {
  @Transform(trimTitle)
  @IsString({ message: 'Todo title must be a string' })
  @MinLength(1, { message: 'Todo title must not be empty' })
  @MaxLength(200, { message: 'Todo title must be at most 200 characters long' })
  title: string;
}

export class UpdateProjectTodoDto {
  @Transform(trimTitle)
  @ValidateIf((_, value) => value !== undefined)
  @IsString({ message: 'Todo title must be a string' })
  @MinLength(1, { message: 'Todo title must not be empty' })
  @MaxLength(200, { message: 'Todo title must be at most 200 characters long' })
  title?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean({ message: 'Todo completion must be a boolean' })
  completed?: boolean;
}

export class SearchProjectTodoDto {
  @Type(() => Number)
  @ValidateIf((_, value) => value !== undefined)
  @IsInt({ message: 'Invalid page number' })
  @Min(1)
  page?: number;

  @Type(() => Number)
  @ValidateIf((_, value) => value !== undefined)
  @IsInt({ message: 'Invalid items per page' })
  @Min(1)
  perPage?: number;
}

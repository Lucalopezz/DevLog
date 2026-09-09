import { CreateTechnicalEntryUseCaseInput } from '@/technical-entry/application/usecases/technical-entry/create-technical-entry.usecase';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry/technical-entry-type.enum';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTechnicalEntryDto implements Omit<
  CreateTechnicalEntryUseCaseInput,
  'userId'
> {
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Invalid parameter' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(200, {
    message: 'Title must be at most 200 characters long',
  })
  title: string;

  @IsOptional()
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId?: string | null;

  @IsNotEmpty({ message: 'Context is required' })
  @IsString({ message: 'Invalid parameter' })
  @MinLength(3, { message: 'Context must be at least 3 characters long' })
  context: string;

  @IsEnum(TechnicalEntryType, { message: 'Invalid parameter' })
  @IsNotEmpty({ message: 'Type is required' })
  type: TechnicalEntryType;

  @IsString({ message: 'Invalid parameter' })
  @IsOptional()
  conclusion?: string | undefined;
}

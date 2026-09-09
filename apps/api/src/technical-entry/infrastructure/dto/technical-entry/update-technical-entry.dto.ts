import { UpdateTechnicalEntryUseCaseInput } from '@/technical-entry/application/usecases/technical-entry/update-technical-entry.usecase';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateTechnicalEntryDto implements Omit<
  UpdateTechnicalEntryUseCaseInput,
  'id' | 'userId'
> {
  // ValidateIf distinguishes omission from null: the field may be omitted, but null
  // is not accepted where the contract requires a string.
  @ValidateIf((_, value) => value !== undefined)
  @IsString({ message: 'Invalid parameter' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(200, {
    message: 'Title must be at most 200 characters long',
  })
  title?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString({ message: 'Invalid parameter' })
  @MinLength(3, { message: 'Context must be at least 3 characters long' })
  context?: string;

  @IsOptional()
  @IsString({ message: 'Invalid parameter' })
  conclusion?: string | null;

  @IsOptional()
  @IsString({ message: 'Invalid parameter' })
  @IsUUID('4', { message: 'Invalid parameter' })
  projectId?: string | null;
}

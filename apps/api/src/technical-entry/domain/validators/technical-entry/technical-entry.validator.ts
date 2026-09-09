import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-fields';
import type { TechnicalEntryProps } from '../../entities/technical-entry/technical-entry.entity';
import { TechnicalEntryType } from '../../entities/technical-entry/technical-entry-type.enum';

export class TechnicalEntryRules {
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID is required' })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId: string;

  @IsOptional()
  @IsString({ message: 'Project ID must be a string' })
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId?: string;

  @MaxLength(200, {
    message: 'Title must be at most 200 characters long',
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @IsString({ message: 'Context must be a string' })
  @IsNotEmpty({ message: 'Context is required' })
  context: string;

  @IsOptional()
  @IsString({ message: 'Conclusion must be a string' })
  conclusion?: string;

  @IsEnum(TechnicalEntryType, {
    message: 'Technical entry type must be valid',
  })
  type: TechnicalEntryType;

  @IsDate({ message: 'Resolution date must be valid' })
  @IsOptional()
  resolvedAt?: Date;

  @IsOptional()
  @IsDate({ message: 'Archive date must be valid' })
  archivedAt?: Date;

  @IsDate({ message: 'Creation date must be valid' })
  createdAt: Date;

  @IsDate({ message: 'Update date must be valid' })
  updatedAt: Date;

  constructor({
    userId,
    projectId,
    title,
    context,
    conclusion,
    type,
    resolvedAt,
    archivedAt,
    createdAt,
    updatedAt,
  }: TechnicalEntryProps) {
    Object.assign(this, {
      userId,
      projectId,
      title,
      context,
      conclusion,
      type,
      resolvedAt,
      archivedAt,
      createdAt,
      updatedAt,
    });
  }
}

export class TechnicalEntryValidator extends ClassValidatorFields<TechnicalEntryRules> {
  validate(data: TechnicalEntryRules): boolean {
    return super.validate(new TechnicalEntryRules(data));
  }
}

export class TechnicalEntryValidatorFactory {
  static create(): TechnicalEntryValidator {
    return new TechnicalEntryValidator();
  }
}

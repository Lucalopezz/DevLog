import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-fields';
import { IsDate, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TagRules {
  @IsString({ message: 'Tag name must be a string' })
  @IsNotEmpty({ message: 'Tag name cannot be empty' })
  @MaxLength(80, {
    message: 'Tag name must be at most 80 characters long',
  })
  name: string;

  @IsString({ message: 'Tag name must be a string' })
  @IsNotEmpty({ message: 'Tag name cannot be empty' })
  @MaxLength(80, {
    message: 'Tag name must be at most 80 characters long',
  })
  userId: string;

  @IsString({ message: 'Tag name must be a string' })
  @IsNotEmpty({ message: 'Tag name cannot be empty' })
  @MaxLength(80, {
    message: 'Tag name must be at most 80 characters long',
  })
  normalizedName: string;

  @IsDate({ message: 'Update date must be valid' })
  createdAt: Date;

  @IsDate({ message: 'Update date must be valid' })
  updatedAt: Date;

  constructor({
    name,
    userId,
    normalizedName,
    createdAt,
    updatedAt,
  }: TagRules) {
    Object.assign(this, {
      name,
      userId,
      normalizedName,
      createdAt,
      updatedAt,
    });
  }
}
export class TagValidator extends ClassValidatorFields<TagRules> {
  validate(data: TagRules): boolean {
    return super.validate(new TagRules(data));
  }
}

export class TagValidatorFactory {
  static create() {
    return new TagValidator();
  }
}

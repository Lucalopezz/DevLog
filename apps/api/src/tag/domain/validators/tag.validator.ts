import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-fields';
import { IsDate, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TagRules {
  @IsString({ message: 'O nome da tag deve ser uma string' })
  @IsNotEmpty({ message: 'O nome da tag não pode ser vazio' })
  @MaxLength(80, {
    message: 'O nome da tag não pode ter mais de 80 caracteres',
  })
  name: string;

  @IsString({ message: 'O nome da tag deve ser uma string' })
  @IsNotEmpty({ message: 'O nome da tag não pode ser vazio' })
  @MaxLength(80, {
    message: 'O nome da tag não pode ter mais de 80 caracteres',
  })
  userId: string;

  @IsString({ message: 'O nome da tag deve ser uma string' })
  @IsNotEmpty({ message: 'O nome da tag não pode ser vazio' })
  @MaxLength(80, {
    message: 'O nome da tag não pode ter mais de 80 caracteres',
  })
  normalizedName: string;

  @IsDate({ message: 'A data de atualização deve ser válida' })
  createdAt: Date;

  @IsDate({ message: 'A data de atualização deve ser válida' })
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

import { Entity } from '@/shared/domain/entities/entity';
import { TagName } from '../value-objects/tag-name';
import { TagValidatorFactory } from '../validators/tag.validator';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';

export type TagProps = {
  name: string;
  userId: string;
  normalizedName: string;
  createdAt: Date;
  updatedAt: Date;
};

// Omite o campo normalizedName, pois ele será gerado automaticamente a partir do name
export type TagCreationProps = Omit<TagProps, 'normalizedName'>;

export class TagEntity extends Entity<TagProps> {
  constructor(props: TagCreationProps, id?: string) {
    const completeProps: TagProps = {
      ...props,
      normalizedName: TagName.normalize(props.name),
    };

    TagEntity.validate(completeProps);
    super(completeProps, id);
  }

  get name(): string {
    return this.props.name;
  }

  get userId(): string {
    return this.props.userId;
  }

  get normalizedName(): string {
    return this.props.normalizedName;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  static validate(props: TagProps) {
    const validator = TagValidatorFactory.create();
    const isValid = validator.validate(props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors ?? {});
    }
  }
}

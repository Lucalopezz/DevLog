import { Entity } from '@/shared/domain/entities/entity';
import { UserValidatorFactory } from '../validators/user.validator';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';

export type UserProps = {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
};

type UserInputProps = Omit<UserProps, 'createdAt' | 'updatedAt'> &
  Partial<Pick<UserProps, 'createdAt' | 'updatedAt'>>;

export class UserEntity extends Entity<UserProps> {
  constructor(props: UserInputProps, id?: string) {
    const createdAt = props.createdAt ?? new Date();
    const updatedAt = props.updatedAt ?? createdAt;
    const completeProps: UserProps = { ...props, createdAt, updatedAt };

    UserEntity.validate(completeProps);
    super(completeProps, id);
  }

  updateName(name?: string): void {
    const updatedProps = {
      ...this.props,
      ...(name !== undefined && { name }),
    };

    UserEntity.validate(updatedProps);

    if (name !== undefined) {
      this.name = name;
      this.updateUpdatedAt();
    }
  }

  updatePassword(password?: string): void {
    const updatedProps = {
      ...this.props,
      ...(password !== undefined && { password }),
    };

    UserEntity.validate(updatedProps);

    if (password !== undefined) {
      this.password = password;
      this.updateUpdatedAt();
    }
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get password(): string {
    return this.props.password;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private set name(name: string) {
    this.props.name = name;
  }

  private set password(password: string) {
    this.props.password = password;
  }
  private updateUpdatedAt() {
    this.props.updatedAt = new Date();
  }

  static validate(props: UserProps): void {
    const userValidator = UserValidatorFactory.create();
    const isValid = userValidator.validate(props);
    if (!isValid) {
      throw new EntityValidationError(userValidator.errors ?? {});
    }
  }
}

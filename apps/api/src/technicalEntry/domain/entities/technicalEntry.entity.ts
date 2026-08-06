import { Entity } from '@/shared/domain/entities/entity';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { TechnicalEntryValidatorFactory } from '../validators/techinicalEntry.validator';
import { TechnicalEntryType } from './technical-entry-type.enum';

export { TechnicalEntryType } from './technical-entry-type.enum';

export type TechnicalEntryProps = {
  userId: string;
  projectId?: string;
  title: string;
  context: string;
  conclusion?: string;
  type: TechnicalEntryType;
  resolvedAt: Date;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class TechnicalEntryEntity extends Entity<TechnicalEntryProps> {
  constructor(
    public readonly props: TechnicalEntryProps,
    id?: string,
  ) {
    TechnicalEntryEntity.validate(props);
    super(props, id);
  }
  update(
    title?: string,
    context?: string,
    conclusion?: string,
    type?: TechnicalEntryType,
    resolvedAt?: Date,
    archivedAt?: Date,
  ): void {
    const updatedProps = {
      ...this.props,
      ...(title !== undefined && { title }),
      ...(context !== undefined && { context }),
      ...(conclusion !== undefined && { conclusion }),
      ...(type !== undefined && { type }),
      ...(resolvedAt !== undefined && { resolvedAt }),
      ...(archivedAt !== undefined && { archivedAt }),
    };

    TechnicalEntryEntity.validate(updatedProps);

    if (title !== undefined) {
      this.title = title;
    }
    if (context !== undefined) {
      this.context = context;
    }
    if (conclusion !== undefined) {
      this.conclusion = conclusion;
    }
    if (type !== undefined) {
      this.type = type;
    }
    if (resolvedAt !== undefined) {
      this.resolvedAt = resolvedAt;
    }
    if (archivedAt !== undefined) {
      this.archivedAt = archivedAt;
    }

    if (
      title !== undefined ||
      context !== undefined ||
      conclusion !== undefined ||
      type !== undefined ||
      resolvedAt !== undefined ||
      archivedAt !== undefined
    ) {
      this.updateUpdatedAt();
    }
  }
  conclude(): void {
    this.resolvedAt = new Date();
    this.updateUpdatedAt();
  }
  archive(): void {
    this.archivedAt = new Date();
    this.updateUpdatedAt();
  }

  get userId(): string {
    return this.props.userId;
  }

  get projectId(): string | undefined {
    return this.props.projectId;
  }

  get title(): string {
    return this.props.title;
  }

  get context(): string {
    return this.props.context;
  }

  get conclusion(): string | undefined {
    return this.props.conclusion;
  }

  get type(): TechnicalEntryType {
    return this.props.type;
  }

  get resolvedAt(): Date {
    return this.props.resolvedAt;
  }

  get archivedAt(): Date | undefined {
    return this.props.archivedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private set title(title: string) {
    this.props.title = title;
  }

  private set context(context: string) {
    this.props.context = context;
  }

  private set conclusion(conclusion: string) {
    this.props.conclusion = conclusion;
  }

  private set type(type: TechnicalEntryType) {
    this.props.type = type;
  }

  private set resolvedAt(resolvedAt: Date) {
    this.props.resolvedAt = resolvedAt;
  }

  private set archivedAt(archivedAt: Date) {
    this.props.archivedAt = archivedAt;
  }

  private updateUpdatedAt(): void {
    this.props.updatedAt = new Date();
  }

  static validate(props: TechnicalEntryProps): void {
    const technicalEntryValidator = TechnicalEntryValidatorFactory.create();
    const isValid = technicalEntryValidator.validate(props);

    if (!isValid) {
      throw new EntityValidationError(technicalEntryValidator.errors ?? {});
    }
  }
}

import { Entity } from '@/shared/domain/entities/entity';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { TechnicalEntryValidatorFactory } from '../validators/technical-entry.validator';
import { TechnicalEntryType } from './technical-entry-type.enum';
import { TechnicalEntryStatus } from './technical-entry-status.enum';

export { TechnicalEntryType } from './technical-entry-type.enum';

export type TechnicalEntryProps = {
  userId: string;
  projectId?: string;
  title: string;
  context: string;
  conclusion?: string;
  type: TechnicalEntryType;
  resolvedAt?: Date;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

type TechnicalEntryInputProps = Omit<
  TechnicalEntryProps,
  'createdAt' | 'updatedAt'
> &
  Partial<Pick<TechnicalEntryProps, 'createdAt' | 'updatedAt'>>;

export class TechnicalEntryEntity extends Entity<TechnicalEntryProps> {
  constructor(props: TechnicalEntryInputProps, id?: string) {
    const createdAt = props.createdAt ?? new Date();
    const updatedAt = props.updatedAt ?? createdAt;
    const completeProps: TechnicalEntryProps = {
      ...props,
      createdAt,
      updatedAt,
    };

    TechnicalEntryEntity.validate(completeProps);
    super(completeProps, id);
  }
  update(title?: string, context?: string): void {
    const updatedProps = {
      ...this.props,
      ...(title !== undefined && { title }),
      ...(context !== undefined && { context }),
    };

    TechnicalEntryEntity.validate(updatedProps);

    if (title !== undefined) {
      this.title = title;
    }
    if (context !== undefined) {
      this.context = context;
    }
    if (title !== undefined || context !== undefined) {
      this.updateUpdatedAt();
    }
  }

  changeConclusion(conclusion: string | null): void {
    const updatedConclusion = conclusion ?? undefined;

    TechnicalEntryEntity.validate({
      ...this.props,
      conclusion: updatedConclusion,
    });

    this.props.conclusion = updatedConclusion;
    this.updateUpdatedAt();
  }

  changeProject(projectId: string | null): void {
    const updatedProjectId = projectId ?? undefined;

    TechnicalEntryEntity.validate({
      ...this.props,
      projectId: updatedProjectId,
    });

    this.props.projectId = updatedProjectId;
    this.updateUpdatedAt();
  }

  linkProject(projectId: string): void {
    this.changeProject(projectId);
  }
  conclude(conclusion: string): void {
    if (this.type !== TechnicalEntryType.ISSUE) {
      throw new EntityValidationError({
        type: ['Somente entradas do tipo ISSUE podem ser concluídas'],
      });
    }

    TechnicalEntryEntity.validate({ ...this.props, conclusion });

    if (!conclusion?.trim()) {
      throw new EntityValidationError({
        conclusion: ['A conclusão é obrigatória para concluir uma entrada'],
      });
    }

    this.conclusion = conclusion;
    this.resolvedAt = new Date();
    this.updateUpdatedAt();
  }
  archive(): void {
    this.archivedAt = new Date();
    this.updateUpdatedAt();
  }
  get status(): TechnicalEntryStatus | undefined {
    if (this.type !== TechnicalEntryType.ISSUE) {
      return undefined;
    }

    return this.resolvedAt
      ? TechnicalEntryStatus.RESOLVED
      : TechnicalEntryStatus.OPEN;
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

  get resolvedAt(): Date | undefined {
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

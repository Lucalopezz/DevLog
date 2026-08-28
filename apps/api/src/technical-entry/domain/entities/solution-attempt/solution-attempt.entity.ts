import { Entity } from '@/shared/domain/entities/entity';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { SolutionAttemptValidatorFactory } from '../../validators/solution-attempt.validator';
import { SolutionAttemptResult } from './solution-attempt-result.enum';

export type SolutionAttemptProps = {
  technicalEntryId: string;
  description: string;
  result: SolutionAttemptResult;
  createdAt: Date;
  updatedAt: Date;
};

type SolutionAttemptInputProps = Omit<
  SolutionAttemptProps,
  'createdAt' | 'updatedAt'
> &
  Partial<Pick<SolutionAttemptProps, 'createdAt' | 'updatedAt'>>;

export class SolutionAttemptEntity extends Entity<SolutionAttemptProps> {
  constructor(props: SolutionAttemptInputProps, id?: string) {
    const createdAt = props.createdAt ?? new Date();
    const updatedAt = props.updatedAt ?? createdAt;
    const completeProps: SolutionAttemptProps = {
      ...props,
      createdAt,
      updatedAt,
    };

    SolutionAttemptEntity.validate(completeProps);
    super(completeProps, id);
  }
  updateDescription(description: string) {
    const updatedProps = {
      ...this.props,
      description,
      updatedAt: new Date(),
    };

    SolutionAttemptEntity.validate(updatedProps);
    this.description = description;
    this.updatedAt = updatedProps.updatedAt;
  }

  updateResult(result: SolutionAttemptResult) {
    const updatedProps = {
      ...this.props,
      result,
      updatedAt: new Date(),
    };

    SolutionAttemptEntity.validate(updatedProps);
    this.result = result;
    this.updatedAt = updatedProps.updatedAt;
  }

  get technicalEntryId(): string {
    return this.props.technicalEntryId;
  }

  get description(): string {
    return this.props.description;
  }

  get result(): SolutionAttemptResult {
    return this.props.result;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private set description(value: string) {
    this.props.description = value;
  }

  private set result(value: SolutionAttemptResult) {
    this.props.result = value;
  }

  private set updatedAt(value: Date) {
    this.props.updatedAt = value;
  }

  static validate(props: SolutionAttemptProps): void {
    const solutionAttemptValidator = SolutionAttemptValidatorFactory.create();
    const isValid = solutionAttemptValidator.validate(props);

    if (!isValid) {
      throw new EntityValidationError(solutionAttemptValidator.errors ?? {});
    }
  }
}

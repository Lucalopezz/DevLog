import { Entity } from '@/shared/domain/entities/entity';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { TechnicalEntryValidatorFactory } from '../validators/technical-entry.validator';
import { TechnicalEntryType } from './technical-entry-type.enum';
import { TechnicalEntryStatus } from './technical-entry-status.enum';
import { SolutionAttemptEntity } from './solution-attempt/solution-attempt.entity';
import { SolutionAttemptResult } from './solution-attempt/solution-attempt-result.enum';

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

export type TechnicalEntryUpdateProps = {
  title?: string;
  context?: string;
  conclusion?: string | null;
  projectId?: string | null;
};

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

  addSolutionAttempt(
    description: string,
    result: SolutionAttemptResult,
  ): SolutionAttemptEntity {
    if (this.type !== TechnicalEntryType.ISSUE) {
      throw new EntityValidationError({
        type: ['Somente ISSUE pode possuir tentativas de solução'],
      });
    }

    if (this.archivedAt) {
      throw new EntityValidationError({
        archivedAt: ['Entradas arquivadas não podem receber tentativas'],
      });
    }
    // Retorna uma nova instância de SolutionAttemptEntity associada a este TechnicalEntryEntity
    return new SolutionAttemptEntity({
      technicalEntryId: this.id,
      description,
      result,
    });
  }

  update(props: TechnicalEntryUpdateProps): void {
    // Object.values transforma as propriedades em uma lista; every garante que
    // pelo menos um campo tenha sido enviado antes de alterar a entidade.
    if (Object.values(props).every((value) => value === undefined)) {
      throw new EntityValidationError({
        update: ['Informe ao menos um campo para atualizar a entrada técnica'],
      });
    }

    const now = new Date();
    // Os spreads condicionais diferenciam campo ausente de campo nulo:
    // ausente preserva o valor atual; null remove uma associação ou conclusão.
    const updatedProps = {
      ...this.props,
      ...(props.title !== undefined ? { title: props.title } : {}),
      ...(props.context !== undefined ? { context: props.context } : {}),
      ...(props.conclusion !== undefined
        ? { conclusion: props.conclusion ?? undefined }
        : {}),
      ...(props.projectId !== undefined
        ? { projectId: props.projectId ?? undefined }
        : {}),
      updatedAt: now,
    };

    TechnicalEntryEntity.validate(updatedProps);

    if (props.title !== undefined) {
      this.title = props.title;
    }
    if (props.context !== undefined) {
      this.context = props.context;
    }
    if (props.conclusion !== undefined) {
      this.conclusion = props.conclusion ?? undefined;
    }
    if (props.projectId !== undefined) {
      this.projectId = props.projectId ?? undefined;
    }
    this.updatedAt = now;
  }

  linkProject(projectId: string): void {
    this.update({ projectId });
  }

  conclude(conclusion: string): void {
    if (this.type !== TechnicalEntryType.ISSUE) {
      throw new EntityValidationError({
        type: ['Somente entradas do tipo ISSUE podem ser concluídas'],
      });
    }

    if (this.resolvedAt !== undefined) {
      throw new EntityValidationError({
        resolvedAt: ['Somente entradas abertas podem ser concluídas'],
      });
    }

    const now = new Date();
    const updatedProps = {
      ...this.props,
      conclusion,
      resolvedAt: now,
      updatedAt: now,
    };

    TechnicalEntryEntity.validate(updatedProps);

    this.conclusion = conclusion;
    this.resolvedAt = now;
    this.updatedAt = now;
  }

  reopen(): void {
    if (this.type !== TechnicalEntryType.ISSUE) {
      throw new EntityValidationError({
        type: ['Somente entradas do tipo ISSUE podem ser reabertas'],
      });
    }

    if (!this.resolvedAt) {
      throw new EntityValidationError({
        resolvedAt: ['Somente entradas resolvidas podem ser reabertas'],
      });
    }

    const now = new Date();
    const updatedProps = {
      ...this.props,
      resolvedAt: undefined,
      updatedAt: now,
    };

    TechnicalEntryEntity.validate(updatedProps);

    // A conclusão e as tentativas fazem parte do histórico e são preservadas.
    this.resolvedAt = undefined;
    this.updatedAt = now;
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

  private set conclusion(conclusion: string | undefined) {
    this.props.conclusion = conclusion;
  }

  private set projectId(projectId: string | undefined) {
    this.props.projectId = projectId;
  }

  private set resolvedAt(resolvedAt: Date | undefined) {
    this.props.resolvedAt = resolvedAt;
  }

  private set archivedAt(archivedAt: Date) {
    this.props.archivedAt = archivedAt;
  }

  private set updatedAt(updatedAt: Date) {
    this.props.updatedAt = updatedAt;
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

    // Essa regra cruzada não cabe em um validador de campo isolado: somente ISSUE
    // participa do ciclo OPEN/RESOLVED.
    if (
      props.type !== TechnicalEntryType.ISSUE &&
      props.resolvedAt !== undefined
    ) {
      throw new EntityValidationError({
        resolvedAt: ['Somente entradas do tipo ISSUE podem ser resolvidas'],
      });
    }

    // resolvedAt e conclusion formam uma invariável: uma entrada resolvida nunca
    // pode existir sem uma conclusão textual.
    if (props.resolvedAt !== undefined && !props.conclusion?.trim()) {
      throw new EntityValidationError({
        conclusion: ['Uma entrada resolvida deve possuir uma conclusão'],
      });
    }
  }
}

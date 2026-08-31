import { Entity } from '@/shared/domain/entities/entity';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { ProjectCommandValidatorFactory } from '../validators/project-command.validator';

export type ProjectCommandProps = {
  projectId: string;
  title: string;
  command: string;
  description?: string;
  executionOrder?: number;
  createdAt: Date;
  updatedAt: Date;
};

type ProjectCommandInputProps = Omit<
  ProjectCommandProps,
  'createdAt' | 'updatedAt'
> &
  Partial<Pick<ProjectCommandProps, 'createdAt' | 'updatedAt'>>;

export type ProjectCommandUpdateProps = {
  title?: string;
  command?: string;
  description?: string | null;
  executionOrder?: number | null;
};

export class ProjectCommandEntity extends Entity<ProjectCommandProps> {
  constructor(props: ProjectCommandInputProps, id?: string) {
    const createdAt = props.createdAt ?? new Date();
    const updatedAt = props.updatedAt ?? createdAt;
    const completeProps: ProjectCommandProps = {
      ...props,
      createdAt,
      updatedAt,
    };

    ProjectCommandEntity.validate(completeProps);
    super(completeProps, id);
  }
  update(props: ProjectCommandUpdateProps): void {
    // Object.values extrai os valores e every verifica se todos são undefined;
    // assim, um PATCH sem campos não modifica artificialmente o updatedAt.
    if (Object.values(props).every((value) => value === undefined)) {
      throw new EntityValidationError({
        update: ['Informe ao menos um campo para atualizar o comando'],
      });
    }

    const now = new Date();
    // Campos ausentes são preservados; null remove somente os campos cujo
    // contrato permite remoção, convertendo-os para undefined no domínio.
    const updatedProps = {
      ...this.props,
      ...(props.title !== undefined ? { title: props.title } : {}),
      ...(props.command !== undefined ? { command: props.command } : {}),
      ...(props.description !== undefined
        ? { description: props.description ?? undefined }
        : {}),
      ...(props.executionOrder !== undefined
        ? { executionOrder: props.executionOrder ?? undefined }
        : {}),
      updatedAt: now,
    };

    ProjectCommandEntity.validate(updatedProps);

    if (props.command !== undefined) {
      this.command = props.command;
    }
    if (props.title !== undefined) {
      this.title = props.title;
    }
    if (props.description !== undefined) {
      this.description = props.description ?? undefined;
    }
    if (props.executionOrder !== undefined) {
      this.executionOrder = props.executionOrder ?? undefined;
    }
    this.updatedAt = now;
  }
  get projectId(): string {
    return this.props.projectId;
  }

  get title(): string {
    return this.props.title;
  }

  get command(): string {
    return this.props.command;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get executionOrder(): number | undefined {
    return this.props.executionOrder;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  private set title(value: string) {
    this.props.title = value;
  }

  private set command(value: string) {
    this.props.command = value;
  }

  private set description(value: string | undefined) {
    this.props.description = value;
  }
  private set executionOrder(value: number | undefined) {
    this.props.executionOrder = value;
  }
  private set updatedAt(value: Date) {
    this.props.updatedAt = value;
  }

  static validate(props: ProjectCommandProps): void {
    const validator = ProjectCommandValidatorFactory.create();
    const isValid = validator.validate(props);

    if (!isValid) {
      throw new EntityValidationError(validator.errors ?? {});
    }
  }
}

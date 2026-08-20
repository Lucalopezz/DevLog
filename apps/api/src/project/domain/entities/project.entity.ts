import { Entity } from '@/shared/domain/entities/entity';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { ProjectStatusEnum } from './project-status-enum';
import { ProjectValidatorFactory } from '../validators/project.validator';

export type ProjectProps = {
  userId: string;
  name: string;
  description?: string;
  status: ProjectStatusEnum;
  localPath?: string;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

type ProjectInputProps = Omit<ProjectProps, 'createdAt' | 'updatedAt'> &
  Partial<Pick<ProjectProps, 'createdAt' | 'updatedAt'>>;

export class ProjectEntity extends Entity<ProjectProps> {
  constructor(props: ProjectInputProps, id?: string) {
    const createdAt = props.createdAt ?? new Date();
    const updatedAt = props.updatedAt ?? createdAt;
    const completeProps: ProjectProps = { ...props, createdAt, updatedAt };

    ProjectEntity.validate(completeProps);
    super(completeProps, id);
  }

  update(
    props: Omit<
      Partial<ProjectProps>,
      'userId' | 'createdAt' | 'updatedAt' | 'archivedAt'
    >,
  ) {
    const now = new Date();

    const updatedProps = {
      ...this.props,
      ...props,
      updatedAt: now,
    };
    ProjectEntity.validate(updatedProps);
    if (props.name !== undefined) {
      this.name = props.name;
    }

    if (props.description !== undefined) {
      this.description = props.description;
    }

    if (props.status !== undefined) {
      this.status = props.status;
    }

    if (props.localPath !== undefined) {
      this.localPath = props.localPath;
    }

    this.updatedAt = updatedProps.updatedAt;
  }

  updateDescription(description?: string) {
    const updatedProps = {
      ...this.props,
      description,
      updatedAt: new Date(),
    };

    ProjectEntity.validate(updatedProps);

    this.description = description;
    this.updatedAt = updatedProps.updatedAt;
  }

  toggleArchive() {
    const now = new Date();
    // Se archivedAt for undefined, significa que o projeto não está arquivado, então arquiva.
    // Caso contrário, vamos desarquiva.
    const archivedAt = this.archivedAt === undefined ? now : undefined;

    const updatedProps = {
      ...this.props,
      archivedAt,
      updatedAt: now,
    };

    ProjectEntity.validate(updatedProps);

    this.archivedAt = archivedAt;
    this.updatedAt = now;
  }

  updatePath(localPath?: string) {
    const updatedProps = {
      ...this.props,
      localPath,
      updatedAt: new Date(),
    };
    ProjectEntity.validate(updatedProps);
    this.localPath = localPath;
    this.updatedAt = updatedProps.updatedAt;
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get status(): ProjectStatusEnum {
    return this.props.status;
  }

  get localPath(): string | undefined {
    return this.props.localPath;
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

  private set name(name: string) {
    this.props.name = name;
  }

  private set description(description: string | undefined) {
    this.props.description = description;
  }

  private set status(status: ProjectStatusEnum) {
    this.props.status = status;
  }

  private set localPath(localPath: string | undefined) {
    this.props.localPath = localPath;
  }

  private set archivedAt(archivedAt: Date | undefined) {
    this.props.archivedAt = archivedAt;
  }

  private set updatedAt(updatedAt: Date) {
    this.props.updatedAt = updatedAt;
  }

  static validate(props: ProjectProps) {
    const validator = ProjectValidatorFactory.create();
    const isValid = validator.validate(props);

    if (!isValid) {
      throw new EntityValidationError(validator.errors ?? {});
    }
  }
}

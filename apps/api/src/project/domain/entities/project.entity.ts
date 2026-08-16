import { Entity } from '@/shared/domain/entities/entity';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { ProjectStatusEnum } from './project-status-enum';
import { ProjectValidatorFactory } from '../validators/project.validator';

export type ProjectProps = {
  userId: string;
  name: string;
  description: string;
  status: ProjectStatusEnum;
  localPath?: string;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class ProjectEntity extends Entity<ProjectProps> {
  constructor(props: ProjectProps, id?: string) {
    ProjectEntity.validate(props);
    super(props, id);
  }

  update(
    props: Omit<
      Partial<ProjectProps>,
      'userId' | 'createdAt' | 'updatedAt' | 'archivedAt'
    >,
  ) {
    const updatedProps = {
      ...this.props,
      ...props,
      updatedAt: new Date(),
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

  archive() {
    const updatedProps = {
      ...this.props,
      status: ProjectStatusEnum.ARCHIVED,
      archivedAt: new Date(),
      updatedAt: new Date(),
    };
    ProjectEntity.validate(updatedProps);
    this.status = ProjectStatusEnum.ARCHIVED;
    this.archivedAt = updatedProps.archivedAt;
    this.updatedAt = updatedProps.updatedAt;
  }

  addPath(localPath: string) {
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

  get description(): string {
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

  private set description(description: string) {
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

import { Entity } from '@/shared/domain/entities/entity';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { ProjectStatusEnum } from './project-status-enum';
import { ProjectValidatorFactory } from '../validators/project.validator';
import { ProjectTechnologyEntity } from './project-technology.entity';
import { ProjectCommandEntity } from './project-command.entity';
import { ProjectResourceEntity } from './project-resource.entity';
import { ProjectResourceType } from './project-resource-type.enum';

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

export type ProjectUpdateProps = {
  name?: string;
  description?: string | null;
  status?: ProjectStatusEnum;
  localPath?: string | null;
};

export class ProjectEntity extends Entity<ProjectProps> {
  constructor(props: ProjectInputProps, id?: string) {
    const createdAt = props.createdAt ?? new Date();
    const updatedAt = props.updatedAt ?? createdAt;
    const completeProps: ProjectProps = { ...props, createdAt, updatedAt };

    ProjectEntity.validate(completeProps);
    super(completeProps, id);
  }
  addTechnology(name: string, version?: string): ProjectTechnologyEntity {
    return new ProjectTechnologyEntity({
      projectId: this.id,
      name,
      version,
    });
  }

  addCommand(
    title: string,
    command: string,
    description?: string,
    executionOrder?: number,
  ): ProjectCommandEntity {
    return new ProjectCommandEntity({
      projectId: this.id,
      title,
      command,
      description,
      executionOrder,
    });
  }

  addResource(
    label: string,
    url: string,
    type: ProjectResourceType,
  ): ProjectResourceEntity {
    return new ProjectResourceEntity({
      projectId: this.id,
      label,
      url,
      type,
    });
  }

  update(props: ProjectUpdateProps): void {
    // A aplicação decide se um update vazio é uma entrada válida. No domínio,
    // ele é apenas um no-op e não deve modificar artificialmente updatedAt.
    if (Object.values(props).every((value) => value === undefined)) {
      return;
    }

    const now = new Date();
    // Os spreads condicionais preservam campos ausentes. Nos campos anuláveis,
    // null é normalizado para undefined, que representa ausência no domínio.
    const updatedProps = {
      ...this.props,
      ...(props.name !== undefined ? { name: props.name } : {}),
      ...(props.description !== undefined
        ? { description: props.description ?? undefined }
        : {}),
      ...(props.status !== undefined ? { status: props.status } : {}),
      ...(props.localPath !== undefined
        ? { localPath: props.localPath ?? undefined }
        : {}),
      updatedAt: now,
    };

    ProjectEntity.validate(updatedProps);

    if (props.name !== undefined) {
      this.name = props.name;
    }

    if (props.description !== undefined) {
      this.description = props.description ?? undefined;
    }

    if (props.status !== undefined) {
      this.status = props.status;
    }

    if (props.localPath !== undefined) {
      this.localPath = props.localPath ?? undefined;
    }

    this.updatedAt = now;
  }

  archive(): void {
    // O retorno antecipado torna o comando idempotente: arquivar duas vezes não
    // restaura nem altera novamente a data de atualização.
    if (this.archivedAt !== undefined) {
      return;
    }

    const now = new Date();
    const updatedProps = {
      ...this.props,
      archivedAt: now,
      updatedAt: now,
    };

    ProjectEntity.validate(updatedProps);

    this.archivedAt = now;
    this.updatedAt = now;
  }

  restore(): void {
    // Restaurar um projeto já ativo também é um no-op, mantendo a operação segura
    // quando uma mesma requisição é repetida.
    if (this.archivedAt === undefined) {
      return;
    }

    const now = new Date();
    const updatedProps = {
      ...this.props,
      archivedAt: undefined,
      updatedAt: now,
    };

    ProjectEntity.validate(updatedProps);

    this.archivedAt = undefined;
    this.updatedAt = now;
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

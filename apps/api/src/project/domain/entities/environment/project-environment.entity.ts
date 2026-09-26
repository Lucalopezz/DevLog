import { Entity } from '@/shared/domain/entities/entity';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { ProjectEnvironmentValidatorFactory } from '../../validators/environment/project-environment.validator';
import { ProjectEnvironmentCategory } from './project-environment-category.enum';
import { normalizeEnvironmentName } from './normalize-environment-name';

export type ProjectEnvironmentProps = {
  projectId: string;
  name: string;
  normalizedName: string;
  category: ProjectEnvironmentCategory;
  operatingSystem?: string;
  runtime?: string;
  runtimeVersion?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

type CreationProps = Omit<
  ProjectEnvironmentProps,
  'normalizedName' | 'createdAt' | 'updatedAt'
> &
  Partial<Pick<ProjectEnvironmentProps, 'createdAt' | 'updatedAt'>>;

export type ProjectEnvironmentUpdateProps = Partial<
  Pick<ProjectEnvironmentProps, 'name' | 'category'>
> & {
  operatingSystem?: string | null;
  runtime?: string | null;
  runtimeVersion?: string | null;
  description?: string | null;
};

function trimOptional(value: string | null | undefined): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

export class ProjectEnvironmentEntity extends Entity<ProjectEnvironmentProps> {
  constructor(props: CreationProps, id?: string) {
    const createdAt = props.createdAt ?? new Date();
    const completeProps: ProjectEnvironmentProps = {
      ...props,
      name: typeof props.name === 'string' ? props.name.trim() : props.name,
      normalizedName: normalizeEnvironmentName(props.name),
      operatingSystem: trimOptional(props.operatingSystem),
      runtime: trimOptional(props.runtime),
      runtimeVersion: trimOptional(props.runtimeVersion),
      description: trimOptional(props.description),
      createdAt,
      updatedAt: props.updatedAt ?? createdAt,
    };
    ProjectEnvironmentEntity.validate(completeProps);
    super(completeProps, id);
  }

  update(changes: ProjectEnvironmentUpdateProps): void {
    if (Object.values(changes).every((value) => value === undefined)) return;

    const next: ProjectEnvironmentProps = {
      ...this.props,
      ...(changes.name !== undefined
        ? {
            name:
              typeof changes.name === 'string'
                ? changes.name.trim()
                : changes.name,
            normalizedName: normalizeEnvironmentName(changes.name),
          }
        : {}),
      ...(changes.category !== undefined ? { category: changes.category } : {}),
      ...(changes.operatingSystem !== undefined
        ? { operatingSystem: trimOptional(changes.operatingSystem) }
        : {}),
      ...(changes.runtime !== undefined
        ? { runtime: trimOptional(changes.runtime) }
        : {}),
      ...(changes.runtimeVersion !== undefined
        ? { runtimeVersion: trimOptional(changes.runtimeVersion) }
        : {}),
      ...(changes.description !== undefined
        ? { description: trimOptional(changes.description) }
        : {}),
    };
    ProjectEnvironmentEntity.validate(next);
    // Compare validated data before changing the timestamp: equivalent input is a no-op.
    const changed = (
      Object.keys(next) as (keyof ProjectEnvironmentProps)[]
    ).some((key) => next[key] !== this.props[key]);
    if (changed) Object.assign(this.props, next, { updatedAt: new Date() });
  }

  get projectId() {
    return this.props.projectId;
  }
  get name() {
    return this.props.name;
  }
  get normalizedName() {
    return this.props.normalizedName;
  }
  get category() {
    return this.props.category;
  }
  get operatingSystem() {
    return this.props.operatingSystem;
  }
  get runtime() {
    return this.props.runtime;
  }
  get runtimeVersion() {
    return this.props.runtimeVersion;
  }
  get description() {
    return this.props.description;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  static validate(props: ProjectEnvironmentProps): void {
    const validator = ProjectEnvironmentValidatorFactory.create();
    if (!validator.validate(props))
      throw new EntityValidationError(validator.errors ?? {});
  }
}

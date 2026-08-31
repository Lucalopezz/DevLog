import { Entity } from '@/shared/domain/entities/entity';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { ProjectResourceType } from './project-resource-type.enum';
import { ProjectResourceValidatorFactory } from '../validators/project-resource.validator';

export type ProjectResourceProps = {
  projectId: string;
  label: string;
  url: string;
  type: ProjectResourceType;
  createdAt: Date;
  updatedAt: Date;
};

type ProjectResourceInputProps = Omit<
  ProjectResourceProps,
  'createdAt' | 'updatedAt'
> &
  Partial<Pick<ProjectResourceProps, 'createdAt' | 'updatedAt'>>;

type ProjectResourceUpdateProps = Omit<
  Partial<ProjectResourceProps>,
  'projectId' | 'createdAt' | 'updatedAt'
>;

export class ProjectResourceEntity extends Entity<ProjectResourceProps> {
  constructor(props: ProjectResourceInputProps, id?: string) {
    const createdAt = props.createdAt ?? new Date();
    const updatedAt = props.updatedAt ?? createdAt;
    const completeProps: ProjectResourceProps = {
      ...props,
      createdAt,
      updatedAt,
    };

    ProjectResourceEntity.validate(completeProps);
    super(completeProps, id);
  }

  update(props: ProjectResourceUpdateProps): void {
    // Object.values + every detecta quando nenhum campo foi informado e impede
    // que uma atualização vazia avance apenas para modificar updatedAt.
    if (Object.values(props).every((value) => value === undefined)) {
      throw new EntityValidationError({
        update: ['Informe ao menos um campo para atualizar o recurso'],
      });
    }

    const updatedProps = {
      ...this.props,
      ...props,
      updatedAt: new Date(),
    };

    ProjectResourceEntity.validate(updatedProps);

    if (props.label !== undefined) {
      this.label = props.label;
    }
    if (props.url !== undefined) {
      this.url = props.url;
    }
    if (props.type !== undefined) {
      this.type = props.type;
    }
    this.updatedAt = updatedProps.updatedAt;
  }

  get projectId(): string {
    return this.props.projectId;
  }

  get label(): string {
    return this.props.label;
  }

  get url(): string {
    return this.props.url;
  }

  get type(): ProjectResourceType {
    return this.props.type;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private set label(value: string) {
    this.props.label = value;
  }

  private set url(value: string) {
    this.props.url = value;
  }

  private set type(value: ProjectResourceType) {
    this.props.type = value;
  }

  private set updatedAt(value: Date) {
    this.props.updatedAt = value;
  }

  static validate(props: ProjectResourceProps): void {
    const validator = ProjectResourceValidatorFactory.create();
    const isValid = validator.validate(props);

    if (!isValid) {
      throw new EntityValidationError(validator.errors ?? {});
    }
  }
}

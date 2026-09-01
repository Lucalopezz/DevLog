import { Entity } from '@/shared/domain/entities/entity';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { ProjectTechnologyValidatorFactory } from '../../validators/technology/project-technology.validator';

export type ProjectTechnologyProps = {
  projectId: string;
  name: string;
  version?: string;
  createdAt: Date;
  updatedAt: Date;
};

// Remove createdAt e updatedAt das propriedades obrigatórias
// e adiciona essas duas propriedades novamente como opcionais.
type ProjectTechnologyInputProps = Omit<
  ProjectTechnologyProps,
  'createdAt' | 'updatedAt'
> &
  Partial<Pick<ProjectTechnologyProps, 'createdAt' | 'updatedAt'>>;

export class ProjectTechnologyEntity extends Entity<ProjectTechnologyProps> {
  constructor(props: ProjectTechnologyInputProps, id?: string) {
    const createdAt = props.createdAt ?? new Date();
    const updatedAt = props.updatedAt ?? createdAt;
    const completeProps: ProjectTechnologyProps = {
      ...props,
      createdAt,
      updatedAt,
    };

    ProjectTechnologyEntity.validate(completeProps);
    super(completeProps, id);
  }

  get projectId(): string {
    return this.props.projectId;
  }

  get name(): string {
    return this.props.name;
  }

  get version(): string | undefined {
    return this.props.version;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static validate(props: ProjectTechnologyProps): void {
    const validator = ProjectTechnologyValidatorFactory.create();
    const isValid = validator.validate(props);

    if (!isValid) {
      throw new EntityValidationError(validator.errors ?? {});
    }
  }
}

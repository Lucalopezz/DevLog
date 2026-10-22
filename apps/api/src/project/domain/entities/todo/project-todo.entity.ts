import { Entity } from '@/shared/domain/entities/entity';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { ProjectTodoValidatorFactory } from '../../validators/todo/project-todo.validator';

export type ProjectTodoProps = {
  projectId: string;
  title: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class ProjectTodoEntity extends Entity<ProjectTodoProps> {
  constructor(
    props: Omit<ProjectTodoProps, 'createdAt' | 'updatedAt'> &
      Partial<Pick<ProjectTodoProps, 'createdAt' | 'updatedAt'>>,
    id?: string,
  ) {
    const createdAt = props.createdAt ?? new Date();
    const completeProps = {
      ...props,
      title: typeof props.title === 'string' ? props.title.trim() : props.title,
      createdAt,
      updatedAt: props.updatedAt ?? createdAt,
    };
    ProjectTodoEntity.validate(completeProps);
    super(completeProps, id);
  }

  update(changes: { title?: string; completed?: boolean }): void {
    const title =
      changes.title === undefined
        ? this.title
        : typeof changes.title === 'string'
          ? changes.title.trim()
          : changes.title;
    const titleChanged = title !== this.title;
    const completionChanged =
      changes.completed !== undefined &&
      changes.completed !== (this.completedAt !== undefined);
    if (!titleChanged && !completionChanged) return;

    const now = new Date();
    // Repeating a completion request preserves the original completion instant.
    const nextProps = {
      ...this.props,
      title,
      completedAt: completionChanged
        ? changes.completed
          ? now
          : undefined
        : this.completedAt,
      updatedAt: now,
    };
    ProjectTodoEntity.validate(nextProps);
    Object.assign(this.props, nextProps);
  }

  get projectId() {
    return this.props.projectId;
  }
  get title() {
    return this.props.title;
  }
  get completedAt() {
    return this.props.completedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  private static validate(props: ProjectTodoProps): void {
    const validator = ProjectTodoValidatorFactory.create();
    if (!validator.validate(props))
      throw new EntityValidationError(validator.errors ?? {});
  }
}

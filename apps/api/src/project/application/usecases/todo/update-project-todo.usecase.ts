import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { ProjectTodoRepository } from '@/project/domain/repositories/todo/project-todo.repository';
import {
  ProjectTodoOutput,
  ProjectTodoOutputMapper,
} from '../../dto/todo/project-todo.dto';

export type UpdateProjectTodoUseCaseInput = {
  userId: string;
  projectId: string;
  todoId: string;
  title?: string;
  completed?: boolean;
};

export class UpdateProjectTodoUseCase implements UseCaseContract<
  UpdateProjectTodoUseCaseInput,
  ProjectTodoOutput
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly todoRepository: ProjectTodoRepository,
  ) {}

  async execute(
    input: UpdateProjectTodoUseCaseInput,
  ): Promise<ProjectTodoOutput> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId)
      throw new NotFoundException('Project not found');
    project.ensureCanBeModified();

    // A valid todo ID is still inaccessible through a different parent project.
    const todo = await this.todoRepository.findById(input.todoId);
    if (!todo || todo.projectId !== project.id)
      throw new NotFoundException('Todo not found');

    if (input.title === undefined && input.completed === undefined)
      throw new UnprocessableEntityException(
        'Provide at least one field to update the todo',
      );

    const previousUpdatedAt = todo.updatedAt;
    todo.update({ title: input.title, completed: input.completed });
    if (todo.updatedAt !== previousUpdatedAt)
      await this.todoRepository.update(todo);
    return ProjectTodoOutputMapper.toOutput(todo);
  }
}

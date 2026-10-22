import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { ProjectTodoRepository } from '@/project/domain/repositories/todo/project-todo.repository';

export type RemoveProjectTodoUseCaseInput = {
  userId: string;
  projectId: string;
  todoId: string;
};

export class RemoveProjectTodoUseCase implements UseCaseContract<
  RemoveProjectTodoUseCaseInput,
  void
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly todoRepository: ProjectTodoRepository,
  ) {}

  async execute(input: RemoveProjectTodoUseCaseInput): Promise<void> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId)
      throw new NotFoundException('Project not found');
    project.ensureCanBeModified();

    const todo = await this.todoRepository.findById(input.todoId);
    if (!todo || todo.projectId !== project.id)
      throw new NotFoundException('Todo not found');
    await this.todoRepository.delete(todo.id);
  }
}

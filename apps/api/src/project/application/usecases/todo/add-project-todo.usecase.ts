import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { ProjectTodoRepository } from '@/project/domain/repositories/todo/project-todo.repository';
import {
  ProjectTodoOutput,
  ProjectTodoOutputMapper,
} from '../../dto/todo/project-todo.dto';

export type AddProjectTodoUseCaseInput = {
  userId: string;
  projectId: string;
  title: string;
};

export class AddProjectTodoUseCase implements UseCaseContract<
  AddProjectTodoUseCaseInput,
  ProjectTodoOutput
> {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly todoRepository: ProjectTodoRepository,
  ) {}

  async execute(input: AddProjectTodoUseCaseInput): Promise<ProjectTodoOutput> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId)
      throw new NotFoundException('Project not found');

    // The project aggregate checks its archive rule when creating a child.
    const todo = project.addTodo(input.title);
    await this.todoRepository.insert(todo);
    return ProjectTodoOutputMapper.toOutput(todo);
  }
}

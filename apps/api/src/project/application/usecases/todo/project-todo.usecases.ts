import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { ProjectTodoRepository } from '@/project/domain/repositories/todo/project-todo.repository';
import {
  ProjectTodoOutput,
  ProjectTodoOutputMapper,
} from '../../dto/todo/project-todo.dto';
import { PaginationOutput } from '@/shared/application/dtos/pagination-output';

type ProjectScope = { userId: string; projectId: string };
type TodoScope = ProjectScope & { todoId: string };

// Every operation loads the parent first: its owner and archive rules govern child access.
abstract class ProjectTodoUseCase {
  constructor(
    protected readonly projects: ProjectRepository,
    protected readonly todos: ProjectTodoRepository,
  ) {}

  protected async findProject(input: ProjectScope) {
    const project = await this.projects.findById(input.projectId);
    if (!project || project.userId !== input.userId)
      throw new NotFoundException('Project not found');
    return project;
  }

  protected async findTodo(input: TodoScope) {
    const todo = await this.todos.findById(input.todoId);
    if (!todo || todo.projectId !== input.projectId)
      throw new NotFoundException('Todo not found');
    return todo;
  }
}

export class AddProjectTodoUseCase extends ProjectTodoUseCase {
  async execute(
    input: ProjectScope & { title: string },
  ): Promise<ProjectTodoOutput> {
    const project = await this.findProject(input);
    const todo = project.addTodo(input.title);
    await this.todos.insert(todo);
    return ProjectTodoOutputMapper.toOutput(todo);
  }
}

export class SearchProjectTodoUseCase extends ProjectTodoUseCase {
  async execute(
    input: ProjectScope & { page?: number; perPage?: number },
  ): Promise<PaginationOutput<ProjectTodoOutput>> {
    await this.findProject(input);
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const result = await this.todos.search(input.projectId, page, perPage);
    return {
      items: result.items.map((item) => ProjectTodoOutputMapper.toOutput(item)),
      total: result.total,
      currentPage: result.currentPage,
      perPage: result.perPage,
      lastPage: result.lastPage,
    };
  }
}

export class UpdateProjectTodoUseCase extends ProjectTodoUseCase {
  async execute(
    input: TodoScope & { title?: string; completed?: boolean },
  ): Promise<ProjectTodoOutput> {
    const project = await this.findProject(input);
    project.ensureCanBeModified();
    const todo = await this.findTodo(input);
    if (input.title === undefined && input.completed === undefined)
      throw new UnprocessableEntityException(
        'Provide at least one field to update the todo',
      );
    const previousUpdatedAt = todo.updatedAt;
    todo.update({ title: input.title, completed: input.completed });
    if (todo.updatedAt !== previousUpdatedAt) await this.todos.update(todo);
    return ProjectTodoOutputMapper.toOutput(todo);
  }
}

export class RemoveProjectTodoUseCase extends ProjectTodoUseCase {
  async execute(input: TodoScope): Promise<void> {
    const project = await this.findProject(input);
    project.ensureCanBeModified();
    const todo = await this.findTodo(input);
    await this.todos.delete(todo.id);
  }
}

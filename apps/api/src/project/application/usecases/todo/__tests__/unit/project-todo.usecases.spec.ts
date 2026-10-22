import { NotFoundException } from '@nestjs/common';
import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { ProjectTodoEntity } from '@/project/domain/entities/todo/project-todo.entity';
import {
  AddProjectTodoUseCase,
  UpdateProjectTodoUseCase,
  RemoveProjectTodoUseCase,
} from '../../project-todo.usecases';

const userId = '37588538-87ef-4776-bc30-c3b7f6280b35';
const projectId = '71ac450c-f334-4d40-bb82-8480d2dd9148';
const otherProjectId = 'eeaf5842-cdfe-4a5b-9076-79647e568684';

describe('Project todo use cases', () => {
  const project = new ProjectEntity(
    { userId, name: 'Test', status: ProjectStatusEnum.ACTIVE },
    projectId,
  );
  const todo = new ProjectTodoEntity({ projectId, title: 'Task' });
  const projects = { findById: jest.fn() };
  const todos = {
    insert: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    projects.findById.mockResolvedValue(project);
    todos.findById.mockResolvedValue(todo);
  });

  it('takes ownership from the caller and creates a child through Project', async () => {
    const result = await new AddProjectTodoUseCase(
      projects as never,
      todos as never,
    ).execute({ userId, projectId, title: ' Task 2 ' });
    expect(todos.insert).toHaveBeenCalledWith(
      expect.objectContaining({ projectId }),
    );
    expect(result.title).toBe('Task 2');
  });

  it('hides a foreign project and a child from another project', async () => {
    await expect(
      new AddProjectTodoUseCase(projects as never, todos as never).execute({
        userId: otherProjectId,
        projectId,
        title: 'Task',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    todos.findById.mockResolvedValue(
      new ProjectTodoEntity({ projectId: otherProjectId, title: 'Foreign' }),
    );
    await expect(
      new UpdateProjectTodoUseCase(projects as never, todos as never).execute({
        userId,
        projectId,
        todoId: todo.id,
        completed: true,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(todos.update).not.toHaveBeenCalled();
  });

  it('blocks mutations on archived projects', async () => {
    const archived = new ProjectEntity(
      {
        userId,
        name: 'Archived',
        status: ProjectStatusEnum.ACTIVE,
        archivedAt: new Date(),
      },
      projectId,
    );
    projects.findById.mockResolvedValue(archived);
    await expect(
      new RemoveProjectTodoUseCase(projects as never, todos as never).execute({
        userId,
        projectId,
        todoId: todo.id,
      }),
    ).rejects.toMatchObject({
      error: { archivedAt: ['Archived projects are read-only'] },
    });
    expect(todos.delete).not.toHaveBeenCalled();
  });
});

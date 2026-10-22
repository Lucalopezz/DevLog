import { ProjectTodoEntity } from '../../project-todo.entity';

const projectId = '37588538-87ef-4776-bc30-c3b7f6280b35';

describe('ProjectTodoEntity', () => {
  it('trims titles and rejects blank or oversized titles', () => {
    const todo = new ProjectTodoEntity({
      projectId,
      title: '  Ship feature  ',
    });
    expect(todo.title).toBe('Ship feature');
    expect(() => new ProjectTodoEntity({ projectId, title: '   ' })).toThrow();
    expect(
      () => new ProjectTodoEntity({ projectId, title: 'x'.repeat(201) }),
    ).toThrow();
  });

  it('sets and clears completedAt, leaving repeated completion unchanged', () => {
    const todo = new ProjectTodoEntity({ projectId, title: 'Ship feature' });
    todo.update({ completed: true });
    const completedAt = todo.completedAt;
    const updatedAt = todo.updatedAt;
    expect(completedAt).toBeInstanceOf(Date);
    todo.update({ completed: true });
    expect(todo.completedAt).toBe(completedAt);
    expect(todo.updatedAt).toBe(updatedAt);
    todo.update({ completed: false });
    expect(todo.completedAt).toBeUndefined();
  });
});

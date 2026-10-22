import { api } from "@/api/http";
import type { Pagination } from "@/api/types";

export type ProjectTodo = {
  id: string;
  projectId: string;
  title: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const projectTodoKeys = {
  project: (projectId: string) => ["project-todos", projectId] as const,
  page: (projectId: string, page: number) =>
    [...projectTodoKeys.project(projectId), { page, perPage: 20 }] as const,
};

export async function listProjectTodos(projectId: string, page: number) {
  const { data } = await api.get<Pagination<ProjectTodo>>(
    `/project/${projectId}/todos`,
    { params: { page, perPage: 20 } },
  );
  return data;
}

export async function createProjectTodo(projectId: string, title: string) {
  const { data } = await api.post<ProjectTodo>(`/project/${projectId}/todos`, {
    title,
  });
  return data;
}

export async function updateProjectTodo(
  projectId: string,
  todoId: string,
  input: { title?: string; completed?: boolean },
) {
  const { data } = await api.patch<ProjectTodo>(
    `/project/${projectId}/todos/${todoId}`,
    input,
  );
  return data;
}

export async function deleteProjectTodo(projectId: string, todoId: string) {
  await api.delete(`/project/${projectId}/todos/${todoId}`);
}

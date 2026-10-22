import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import {
  createProjectTodo,
  deleteProjectTodo,
  listProjectTodos,
  projectTodoKeys,
  updateProjectTodo,
} from "../api/project-todos";

export function useProjectTodos(projectId: string, page: number) {
  return useQuery({
    queryKey: projectTodoKeys.page(projectId, page),
    queryFn: () => listProjectTodos(projectId, page),
    enabled: Boolean(projectId),
    retry: false,
  });
}

function useTodoInvalidation() {
  const queryClient = useQueryClient();
  // Each project has its own cache branch. A write refreshes all of its pages
  // because completing an item can move it later in the server's sort order.
  return (projectId: string) =>
    queryClient.invalidateQueries({
      queryKey: projectTodoKeys.project(projectId),
    });
}

export function useCreateProjectTodo() {
  const invalidate = useTodoInvalidation();
  return useMutation({
    mutationFn: ({ projectId, title }: { projectId: string; title: string }) =>
      createProjectTodo(projectId, title),
    onSuccess: async (todo) => {
      toast.success("To-do added.");
      await invalidate(todo.projectId);
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(error, "Could not add the to-do. Try again."),
      ),
  });
}

export function useUpdateProjectTodo() {
  const invalidate = useTodoInvalidation();
  return useMutation({
    mutationFn: ({
      projectId,
      todoId,
      input,
    }: {
      projectId: string;
      todoId: string;
      input: { title?: string; completed?: boolean };
    }) => updateProjectTodo(projectId, todoId, input),
    onSuccess: async (todo) => {
      await invalidate(todo.projectId);
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(error, "Could not update the to-do. Try again."),
      ),
  });
}

export function useDeleteProjectTodo() {
  const invalidate = useTodoInvalidation();
  return useMutation({
    mutationFn: ({
      projectId,
      todoId,
    }: {
      projectId: string;
      todoId: string;
    }) => deleteProjectTodo(projectId, todoId),
    onSuccess: async (_result, { projectId }) => {
      toast.success("To-do deleted.");
      await invalidate(projectId);
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(error, "Could not delete the to-do. Try again."),
      ),
  });
}

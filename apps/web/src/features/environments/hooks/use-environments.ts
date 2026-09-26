import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import {
  createProjectEnvironment,
  deleteProjectEnvironment,
  environmentKeys,
  listEnvironments,
  listProjectEnvironments,
  updateProjectEnvironment,
} from "../api/environment-api";
import type {
  EnvironmentInput,
  EnvironmentUpdateInput,
  ListEnvironmentsParams,
} from "../types/environment";

export function useEnvironments(params: ListEnvironmentsParams) {
  return useQuery({
    queryKey: environmentKeys.list(params),
    queryFn: () => listEnvironments(params),
  });
}
export function useProjectEnvironments(
  projectId: string,
  page = 1,
  enabled = true,
) {
  const params = {
    page,
    perPage: 6,
    sort: "name" as const,
    sortDir: "asc" as const,
  };
  return useQuery({
    queryKey: environmentKeys.projectList(projectId, params),
    queryFn: () => listProjectEnvironments(projectId, params),
    enabled: Boolean(projectId) && enabled,
    retry: false,
  });
}
function useEnvironmentInvalidation() {
  const queryClient = useQueryClient();
  // A record is shown in both the project tab and the global page.
  return async (projectId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: environmentKeys.project(projectId),
      }),
      queryClient.invalidateQueries({ queryKey: environmentKeys.lists() }),
    ]);
  };
}
export function useCreateProjectEnvironment() {
  const invalidate = useEnvironmentInvalidation();
  return useMutation({
    mutationFn: ({
      projectId,
      input,
    }: {
      projectId: string;
      input: EnvironmentInput;
    }) => createProjectEnvironment(projectId, input),
    onSuccess: async (environment) => {
      toast.success("Environment created successfully.");
      await invalidate(environment.projectId);
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(
          error,
          "Could not create the environment. Try again.",
        ),
      ),
  });
}
export function useUpdateProjectEnvironment() {
  const invalidate = useEnvironmentInvalidation();
  return useMutation({
    mutationFn: ({
      projectId,
      environmentId,
      input,
    }: {
      projectId: string;
      environmentId: string;
      input: EnvironmentUpdateInput;
    }) => updateProjectEnvironment(projectId, environmentId, input),
    onSuccess: async (environment) => {
      toast.success("Environment updated successfully.");
      await invalidate(environment.projectId);
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(
          error,
          "Could not update the environment. Try again.",
        ),
      ),
  });
}
export function useDeleteProjectEnvironment() {
  const invalidate = useEnvironmentInvalidation();
  return useMutation({
    mutationFn: ({
      projectId,
      environmentId,
    }: {
      projectId: string;
      environmentId: string;
    }) => deleteProjectEnvironment(projectId, environmentId),
    onSuccess: async (_result, { projectId }) => {
      toast.success("Environment deleted successfully.");
      await invalidate(projectId);
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(
          error,
          "Could not delete the environment. Try again.",
        ),
      ),
  });
}

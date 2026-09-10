import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { getProjectQueryKey } from "../api/get-project";
import { projectsKeys } from "../api/list-projects";
import { projectDetailKeys } from "../api/list-project-details";
import { archiveProject } from "../api/archive-project";
import { restoreProject } from "../api/restore-project";
import { deleteProject } from "../api/delete-project";

export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveProject,
    onSuccess: async (_, projectId) => {
      toast.success("Project archived successfully.");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getProjectQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: projectDetailKeys.all(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: projectsKeys.lists(),
        }),
      ]);
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Could not archive the project."),
      );
    },
  });
}

export function useRestoreProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreProject,
    onSuccess: async (_, projectId) => {
      toast.success("Project restored successfully.");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getProjectQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: projectDetailKeys.all(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: projectsKeys.lists(),
        }),
      ]);
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Could not restore the project."),
      );
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: async (_, projectId) => {
      queryClient.removeQueries({
        queryKey: getProjectQueryKey(projectId),
      });

      await queryClient.invalidateQueries({
        queryKey: projectsKeys.lists(),
      });

      toast.success("Project deleted successfully.");
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Could not delete the project."),
      );
    },
  });
}

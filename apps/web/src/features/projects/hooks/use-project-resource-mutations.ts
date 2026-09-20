import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { createProjectResource } from "../api/create-project-resource";
import { deleteProjectResource } from "../api/delete-project-resource";
import { projectDetailKeys } from "../api/list-project-details";
import { updateProjectResource } from "../api/update-project-resource";
import type { ProjectResourceInput } from "../types/project-detail";

export function useCreateProjectResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: ProjectResourceInput }) =>
      createProjectResource(projectId, input),
    onSuccess: async (resource) => {
      toast.success("Resource created successfully.");
      await queryClient.invalidateQueries({
        queryKey: projectDetailKeys.resourcesRoot(resource.projectId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not create the resource. Try again."));
    },
  });
}

export function useUpdateProjectResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      resourceId,
      input,
    }: {
      projectId: string;
      resourceId: string;
      input: ProjectResourceInput;
    }) => updateProjectResource(projectId, resourceId, input),
    onSuccess: async (resource) => {
      toast.success("Resource updated successfully.");
      await queryClient.invalidateQueries({
        queryKey: projectDetailKeys.resourcesRoot(resource.projectId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not update the resource. Try again."));
    },
  });
}

export function useDeleteProjectResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, resourceId }: { projectId: string; resourceId: string }) =>
      deleteProjectResource(projectId, resourceId),
    onSuccess: async (_result, { projectId }) => {
      toast.success("Resource deleted successfully.");
      await queryClient.invalidateQueries({
        queryKey: projectDetailKeys.resourcesRoot(projectId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not delete the resource. Try again."));
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { getProjectQueryKey } from "@/features/projects/api/get-project";
import {
  addProjectTechnology,
  removeProjectTechnology,
  technologiesKeys,
} from "../api/technology-api";
import type { CreateProjectTechnologyInput } from "../types/technology";

export function useAddProjectTechnology(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectTechnologyInput) =>
      addProjectTechnology(projectId, input),
    onSuccess: async () => {
      toast.success("Technology added to the project.");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getProjectQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: technologiesKeys.lists(),
        }),
      ]);
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Could not add this technology. Try again."),
      );
    },
  });
}

export function useRemoveProjectTechnology(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (technologyId: string) =>
      removeProjectTechnology({ projectId, technologyId }),
    onSuccess: async () => {
      toast.success("Technology removed from the project.");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getProjectQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: technologiesKeys.lists(),
        }),
      ]);
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Could not remove this technology. Try again.",
        ),
      );
    },
  });
}

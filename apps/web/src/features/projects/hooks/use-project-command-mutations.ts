import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { createProjectCommand } from "../api/create-project-command";
import { deleteProjectCommand } from "../api/delete-project-command";
import {
  projectDetailKeys,
} from "../api/list-project-details";
import { updateProjectCommand } from "../api/update-project-command";
import type {
  ProjectCommandInput,
  UpdateProjectCommandInput,
} from "../types/project-detail";

export function useCreateProjectCommand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: ProjectCommandInput }) =>
      createProjectCommand(projectId, input),
    onSuccess: async (command) => {
      toast.success("Command created successfully.");
      // All command pages share a root key, so invalidation refreshes the active
      // page while keeping other project collections in their own cache branch.
      await queryClient.invalidateQueries({
        queryKey: projectDetailKeys.commandsRoot(command.projectId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not create the command. Try again."));
    },
  });
}

export function useUpdateProjectCommand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      commandId,
      input,
    }: {
      projectId: string;
      commandId: string;
      input: UpdateProjectCommandInput;
    }) => updateProjectCommand(projectId, commandId, input),
    onSuccess: async (command) => {
      toast.success("Command updated successfully.");
      await queryClient.invalidateQueries({
        queryKey: projectDetailKeys.commandsRoot(command.projectId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not update the command. Try again."));
    },
  });
}

export function useDeleteProjectCommand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, commandId }: { projectId: string; commandId: string }) =>
      deleteProjectCommand(projectId, commandId),
    onSuccess: async (_result, { projectId }) => {
      toast.success("Command deleted successfully.");
      await queryClient.invalidateQueries({
        queryKey: projectDetailKeys.commandsRoot(projectId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not delete the command. Try again."));
    },
  });
}

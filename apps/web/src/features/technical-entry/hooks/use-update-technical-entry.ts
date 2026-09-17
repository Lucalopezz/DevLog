import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { getTechnicalEntryQueryKey } from "../api/get-technical-entry";
import { technicalEntriesKeys } from "../api/list-technical-entries";
import { updateTechnicalEntry } from "../api/update-technical-entry";
import { projectDetailKeys } from "@/features/projects/api/list-project-details";
import type { TechnicalEntry } from "../types/technical-entry";
import type { UpdateTechnicalEntryInput } from "../types/technical-entry";

export type UpdateTechnicalEntryMutationInput = {
  technicalEntryId: string;
  input: UpdateTechnicalEntryInput;
};

export function useUpdateTechnicalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ technicalEntryId, input }: UpdateTechnicalEntryMutationInput) =>
      updateTechnicalEntry(technicalEntryId, input),

    onSuccess: async (technicalEntry, { technicalEntryId }) => {
      toast.success("Technical entry updated successfully.");

      // Refresh both the detail cache and every filtered list containing this
      // entry. A project reassignment can affect both the old and new lists.
      const previousProjectId = queryClient.getQueryData<TechnicalEntry>(
        getTechnicalEntryQueryKey(technicalEntryId),
      )?.projectId;
      const projectIds = new Set(
        [previousProjectId, technicalEntry.projectId].filter(
          (id): id is string => Boolean(id),
        ),
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getTechnicalEntryQueryKey(technicalEntryId),
        }),
        queryClient.invalidateQueries({
          queryKey: technicalEntriesKeys.lists(),
        }),
        ...[...projectIds].map((projectId) =>
          queryClient.invalidateQueries({
            queryKey: projectDetailKeys.technicalEntriesRoot(projectId),
          }),
        ),
      ]);
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Could not update the technical entry. Try again.",
        ),
      );
    },
  });
}

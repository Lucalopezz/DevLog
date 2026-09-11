import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { getTechnicalEntryQueryKey } from "../api/get-technical-entry";
import { technicalEntriesKeys } from "../api/list-technical-entries";
import { updateTechnicalEntry } from "../api/update-technical-entry";
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

    onSuccess: async (_technicalEntry, { technicalEntryId }) => {
      toast.success("Technical entry updated successfully.");

      // Refresh both the detail cache and every filtered list containing this
      // entry. The server remains the source of truth after the PATCH.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getTechnicalEntryQueryKey(technicalEntryId),
        }),
        queryClient.invalidateQueries({
          queryKey: technicalEntriesKeys.lists(),
        }),
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

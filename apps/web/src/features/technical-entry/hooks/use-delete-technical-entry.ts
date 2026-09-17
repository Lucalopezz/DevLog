import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { deleteTechnicalEntry } from "../api/delete-technical-entry";
import { getTechnicalEntryQueryKey } from "../api/get-technical-entry";
import { technicalEntriesKeys } from "../api/list-technical-entries";
import { projectDetailKeys } from "@/features/projects/api/list-project-details";
import type { TechnicalEntry } from "../types/technical-entry";

export function useDeleteTechnicalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTechnicalEntry,

    onSuccess: async (_result, technicalEntryId) => {
      // DELETE has no response body, so capture the relationship before
      // removing the cached detail. The detail page has already loaded it.
      const projectId = queryClient.getQueryData<TechnicalEntry>(
        getTechnicalEntryQueryKey(technicalEntryId),
      )?.projectId;
      // A deleted detail must not remain available through an old cache entry.
      queryClient.removeQueries({
        queryKey: getTechnicalEntryQueryKey(technicalEntryId),
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: technicalEntriesKeys.lists() }),
        ...(projectId
          ? [queryClient.invalidateQueries({
              queryKey: projectDetailKeys.technicalEntriesRoot(projectId),
            })]
          : []),
      ]);

      toast.success("Technical entry deleted successfully.");
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Could not delete the technical entry. Try again.",
        ),
      );
    },
  });
}

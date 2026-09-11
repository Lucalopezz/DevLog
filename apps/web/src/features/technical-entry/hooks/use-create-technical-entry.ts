import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { projectDetailKeys } from "@/features/projects/api/list-project-details";
import { createTechnicalEntry } from "../api/create-technical-entry";
import { technicalEntriesKeys } from "../api/list-technical-entries";

export function useCreateTechnicalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTechnicalEntry,

    onSuccess: async (entry) => {
      toast.success("Technical entry created successfully.");

      // Different pages and filters are cached as separate list queries, so
      // invalidate the list group instead of guessing which page is visible.
      const invalidations = [
        queryClient.invalidateQueries({
          queryKey: technicalEntriesKeys.lists(),
        }),
      ];

      // The project detail page uses a different query-key branch from the
      // global technical-entry list. Refresh that branch after a linked entry
      // is created so the new card appears without a manual reload.
      if (entry.projectId) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: projectDetailKeys.technicalEntriesRoot(entry.projectId),
          }),
        );
      }

      await Promise.all(invalidations);
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Could not create the technical entry. Try again.",
        ),
      );
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { createTechnicalEntry } from "../api/create-technical-entry";
import { technicalEntriesKeys } from "../api/list-technical-entries";

export function useCreateTechnicalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTechnicalEntry,

    onSuccess: async () => {
      toast.success("Technical entry created successfully.");

      // Different pages and filters are cached as separate list queries, so
      // invalidate the list group instead of guessing which page is visible.
      await queryClient.invalidateQueries({
        queryKey: technicalEntriesKeys.lists(),
      });
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

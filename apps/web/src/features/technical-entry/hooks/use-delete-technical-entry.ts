import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { deleteTechnicalEntry } from "../api/delete-technical-entry";
import { getTechnicalEntryQueryKey } from "../api/get-technical-entry";
import { technicalEntriesKeys } from "../api/list-technical-entries";

export function useDeleteTechnicalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTechnicalEntry,

    onSuccess: async (_result, technicalEntryId) => {
      // A deleted detail must not remain available through an old cache entry.
      queryClient.removeQueries({
        queryKey: getTechnicalEntryQueryKey(technicalEntryId),
      });

      await queryClient.invalidateQueries({
        queryKey: technicalEntriesKeys.lists(),
      });

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

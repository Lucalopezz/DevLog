import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { technicalEntriesKeys } from "@/features/technical-entry/api/list-technical-entries";
import { deleteTag } from "../api/delete-tag";
import { tagKeys } from "../api/list-tags";

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTag,

    onSuccess: async () => {
      toast.success("Tag deleted successfully!");

      // Deleting a tag also removes its entry relationships in the backend.
      // Refresh both tag lists and entry lists so stale tag badges disappear.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: tagKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: technicalEntriesKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: ["technical-entry"],
        }),
      ]);
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Could not delete the tag. Try again."),
      );
    },
  });
}

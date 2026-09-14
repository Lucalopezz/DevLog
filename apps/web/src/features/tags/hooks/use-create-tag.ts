import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { createTag } from "../api/create-tag";
import { tagKeys } from "../api/list-tags";

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTag,

    onSuccess: async () => {
      toast.success("Tag created successfully!");

      // Each tag search has its own cache entry. Invalidating the list root
      // refreshes every relevant page and search after a new tag is created.
      await queryClient.invalidateQueries({
        queryKey: tagKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Could not create the tag. Try again."),
      );
    },
  });
}

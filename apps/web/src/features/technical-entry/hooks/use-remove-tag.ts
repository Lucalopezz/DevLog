import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { removeTagFromTechnicalEntry } from "../api/remove-tag-from-technical-entry";
import { invalidateTechnicalEntryQueries } from "./invalidate-technical-entry-queries";

export type RemoveTagMutationInput = {
  technicalEntryId: string;
  tagId: string;
  projectId?: string;
};

export function useRemoveTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ technicalEntryId, tagId }: RemoveTagMutationInput) =>
      removeTagFromTechnicalEntry({ technicalEntryId, tagId }),

    onSuccess: async (_value, { technicalEntryId, projectId }) => {
      toast.success("Tag removed successfully.");
      await invalidateTechnicalEntryQueries(
        queryClient,
        technicalEntryId,
        projectId,
      );
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Could not remove the tag. Try again."),
      );
    },
  });
}

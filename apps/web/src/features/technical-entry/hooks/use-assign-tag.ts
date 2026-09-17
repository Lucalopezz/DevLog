import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignTagToTechnicalEntry } from "../api/assign-tag-to-technical-entry";
import { toast } from "sonner";
import { invalidateTechnicalEntryQueries } from "./invalidate-technical-entry-queries";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

export type AssignTagMutationInput = {
  technicalEntryId: string;
  tagId: string;
  projectId?: string;
};

export function useAssignTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ technicalEntryId, tagId }: AssignTagMutationInput) =>
      assignTagToTechnicalEntry({ technicalEntryId, tagId }),

    onSuccess: async (_tag, { technicalEntryId, projectId }) => {
      toast.success("Tag assigned successfully.");
      await invalidateTechnicalEntryQueries(
        queryClient,
        technicalEntryId,
        projectId,
      );
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Could not assign the tag. Try again."),
      );
    },
  });
}

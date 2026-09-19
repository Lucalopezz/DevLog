import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { updateSolutionAttempt } from "../api/update-solution-attempt";
import { solutionAttemptsKeys } from "./use-solution-attempt";
import type { UpdateSolutionAttemptInput } from "../types/solution-attempt";

export type UpdateSolutionAttemptMutationInput = {
  technicalEntryId: string;
  attemptId: string;
  input: UpdateSolutionAttemptInput;
};

export function useUpdateSolutionAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ technicalEntryId, attemptId, input }: UpdateSolutionAttemptMutationInput) =>
      updateSolutionAttempt(technicalEntryId, attemptId, input),

    onSuccess: async (_attempt, { technicalEntryId }) => {
      toast.success("Solution attempt updated.");

      // Descriptions are present on every page, so refresh this entry's
      // paginated lists to keep cached views consistent with the server.
      await queryClient.invalidateQueries({
        queryKey: solutionAttemptsKeys.forEntry(technicalEntryId),
      });
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Could not update the solution attempt. Try again.",
        ),
      );
    },
  });
}

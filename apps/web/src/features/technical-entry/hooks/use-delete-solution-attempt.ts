import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { deleteSolutionAttempt } from "../api/delete-solution-attempt";
import { solutionAttemptsKeys } from "./use-solution-attempt";

export type DeleteSolutionAttemptMutationInput = {
  technicalEntryId: string;
  attemptId: string;
};

export function useDeleteSolutionAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ technicalEntryId, attemptId }: DeleteSolutionAttemptMutationInput) =>
      deleteSolutionAttempt(technicalEntryId, attemptId),

    onSuccess: async (_result, { technicalEntryId }) => {
      await queryClient.invalidateQueries({
        queryKey: solutionAttemptsKeys.forEntry(technicalEntryId),
      });
      toast.success("Solution attempt deleted.");
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Could not delete the solution attempt. Try again.",
        ),
      );
    },
  });
}

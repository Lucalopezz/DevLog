import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { addSolutionAttempt } from "../api/add-solution-attempt";
import { solutionAttemptsKeys } from "./use-solution-attempt";
import type { AddSolutionAttemptInput } from "../types/solution-attempt";

export type AddSolutionAttemptMutationInput = {
  technicalEntryId: string;
  input: AddSolutionAttemptInput;
};

export function useAddSolutionAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      technicalEntryId,
      input,
    }: AddSolutionAttemptMutationInput) =>
      addSolutionAttempt(technicalEntryId, input),

    onSuccess: async (_attempt, { technicalEntryId }) => {
      toast.success("Solution attempt added.");

      // Refresh every page and filter for this entry so the new attempt appears
      // in the server-defined order.
      await queryClient.invalidateQueries({
        queryKey: solutionAttemptsKeys.forEntry(technicalEntryId),
      });
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Could not add the solution attempt. Try again.",
        ),
      );
    },
  });
}

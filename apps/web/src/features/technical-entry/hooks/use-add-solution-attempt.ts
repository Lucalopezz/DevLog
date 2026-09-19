import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { addSolutionAttempt } from "../api/add-solution-attempt";
import { solutionAttemptsKeys } from "./use-solution-attempt";
import { getTechnicalEntryQueryKey } from "../api/get-technical-entry";
import { invalidateTechnicalEntryQueries } from "./invalidate-technical-entry-queries";
import type { TechnicalEntry } from "../types/technical-entry";
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

      // Successful attempts can also close the issue, so refresh its detail,
      // journal lists, and project list alongside every page of attempts.
      const entry = queryClient.getQueryData<TechnicalEntry>(
        getTechnicalEntryQueryKey(technicalEntryId),
      );
      await Promise.all([
        invalidateTechnicalEntryQueries(
          queryClient,
          technicalEntryId,
          entry?.projectId,
        ),
        queryClient.invalidateQueries({
          queryKey: solutionAttemptsKeys.forEntry(technicalEntryId),
        }),
      ]);
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

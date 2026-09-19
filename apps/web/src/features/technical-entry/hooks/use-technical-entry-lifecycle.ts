import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import {
  archiveTechnicalEntry,
  restoreTechnicalEntry,
} from "../api/archive-technical-entry";
import {
  reopenTechnicalIssue,
  resolveTechnicalIssue,
} from "../api/technical-entry-status";
import { invalidateTechnicalEntryQueries } from "./invalidate-technical-entry-queries";
import type { ResolveTechnicalIssueInput } from "../types/technical-entry";

export type ResolveTechnicalIssueMutationInput = {
  technicalEntryId: string;
  input: ResolveTechnicalIssueInput;
};

export function useArchiveTechnicalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveTechnicalEntry,
    onSuccess: async (entry, technicalEntryId) => {
      toast.success("Technical entry archived successfully.");
      await invalidateTechnicalEntryQueries(
        queryClient,
        technicalEntryId,
        entry.projectId,
      );
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Could not archive the technical entry."),
      );
    },
  });
}

export function useRestoreTechnicalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreTechnicalEntry,
    onSuccess: async (entry, technicalEntryId) => {
      toast.success("Technical entry restored successfully.");
      await invalidateTechnicalEntryQueries(
        queryClient,
        technicalEntryId,
        entry.projectId,
      );
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Could not restore the technical entry."),
      );
    },
  });
}

export function useResolveTechnicalIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ technicalEntryId, input }: ResolveTechnicalIssueMutationInput) =>
      resolveTechnicalIssue(technicalEntryId, input),
    onSuccess: async (entry, { technicalEntryId }) => {
      toast.success("Issue closed successfully.");
      await invalidateTechnicalEntryQueries(
        queryClient,
        technicalEntryId,
        entry.projectId,
      );
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Could not close the issue. Try again."),
      );
    },
  });
}

export function useReopenTechnicalIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reopenTechnicalIssue,
    onSuccess: async (entry, technicalEntryId) => {
      toast.success("Issue reopened successfully.");
      await invalidateTechnicalEntryQueries(
        queryClient,
        technicalEntryId,
        entry.projectId,
      );
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Could not reopen the issue. Try again."),
      );
    },
  });
}

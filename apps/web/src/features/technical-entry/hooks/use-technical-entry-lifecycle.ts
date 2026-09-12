import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { projectDetailKeys } from "@/features/projects/api/list-project-details";
import { getTechnicalEntryQueryKey } from "../api/get-technical-entry";
import { technicalEntriesKeys } from "../api/list-technical-entries";
import {
  archiveTechnicalEntry,
  restoreTechnicalEntry,
} from "../api/archive-technical-entry";

async function invalidateTechnicalEntryQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  technicalEntryId: string,
  projectId?: string,
) {
  const invalidations = [
    queryClient.invalidateQueries({
      queryKey: getTechnicalEntryQueryKey(technicalEntryId),
    }),
    queryClient.invalidateQueries({
      queryKey: technicalEntriesKeys.lists(),
    }),
  ];

  // Project detail lists have their own query-key branch and also hide
  // archived entries by default, so they need an explicit refresh too.
  if (projectId) {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: projectDetailKeys.technicalEntriesRoot(projectId),
      }),
    );
  }

  await Promise.all(invalidations);
}

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

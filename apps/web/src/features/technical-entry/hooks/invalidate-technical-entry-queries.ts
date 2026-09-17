import type { QueryClient } from "@tanstack/react-query";
import { getTechnicalEntryQueryKey } from "../api/get-technical-entry";
import { technicalEntriesKeys } from "../api/list-technical-entries";
import { projectDetailKeys } from "@/features/projects/api/list-project-details";

export async function invalidateTechnicalEntryQueries(
  queryClient: QueryClient,
  technicalEntryId: string,
  projectId?: string,
) {
  const invalidations = [
    // Invalidate the specific technical entry query
    // The get route for a technical entry
    queryClient.invalidateQueries({
      queryKey: getTechnicalEntryQueryKey(technicalEntryId),
    }),
    // And the list of technical entries
    queryClient.invalidateQueries({
      queryKey: technicalEntriesKeys.lists(),
    }),
  ];

  // The project detail page has a separate query-key branch. Without this
  // invalidation, its entry card can keep showing an old tag list.
  if (projectId) {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: projectDetailKeys.technicalEntriesRoot(projectId),
      }),
    );
  }

  await Promise.all(invalidations);
}

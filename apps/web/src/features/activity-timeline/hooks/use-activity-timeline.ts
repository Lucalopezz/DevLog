import { useInfiniteQuery } from "@tanstack/react-query";
import {
  listTechnicalEntries,
  technicalEntriesKeys,
} from "@/features/technical-entry/api/list-technical-entries";
import type { ListTechnicalEntriesParams } from "@/features/technical-entry/types/technical-entry";

export function useActivityTimeline(
  filters: Pick<ListTechnicalEntriesParams, "projectId" | "type">,
) {
  const params = {
    ...filters,
    perPage: 20,
    archivedAt: "null",
    sort: "createdAt",
    sortDir: "desc",
  } satisfies ListTechnicalEntriesParams;

  return useInfiniteQuery({
    // Each filter combination owns its pages. A new combination starts at
    // page 1 instead of appending unrelated entries to the visible timeline.
    queryKey: technicalEntriesKeys.infinite(params),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      listTechnicalEntries({ ...params, page: pageParam }, signal),
    // Return the next page number if there are more pages to fetch, otherwise return undefined to stop fetching.
    getNextPageParam: ({ meta }) =>
      meta.currentPage < meta.lastPage ? meta.currentPage + 1 : undefined,
  });
}

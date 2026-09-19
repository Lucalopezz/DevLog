import { useQuery } from "@tanstack/react-query";
import type { ListSolutionAttemptsParams } from "../types/solution-attempt";
import { listSolutionAttempts } from "../api/list-solution-attempts";

export const solutionAttemptsKeys = {
  all: ["solution-attempts"] as const,

  // This prefix allows invalidating all pages and filters of an entry
  forEntry: (technicalEntryId: string) =>
    [...solutionAttemptsKeys.all, technicalEntryId] as const,

  list: (technicalEntryId: string, params: ListSolutionAttemptsParams) =>
    [...solutionAttemptsKeys.forEntry(technicalEntryId), params] as const,
};

const defaultParams: ListSolutionAttemptsParams = {
  page: 1,
  perPage: 10,
  sort: "createdAt",
  sortDir: "asc",
};

export function useSolutionAttempts(
  technicalEntryId: string,
  params: ListSolutionAttemptsParams = defaultParams,
) {
  return useQuery({
    queryKey: solutionAttemptsKeys.list(technicalEntryId, params),
    queryFn: () => listSolutionAttempts(technicalEntryId, params),

    // The route may not have provided the ID yet while the page is loading.
    enabled: Boolean(technicalEntryId),
  });
}

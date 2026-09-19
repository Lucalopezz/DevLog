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
  sortDir: "desc",
};

export function useSolutionAttempts(
  technicalEntryId: string,
  params: ListSolutionAttemptsParams = {},
) {
  // Keep pagination overrides small while consistently applying the list's
  // page size and newest-first order.
  const queryParams = { ...defaultParams, ...params };

  return useQuery({
    queryKey: solutionAttemptsKeys.list(technicalEntryId, queryParams),
    queryFn: () => listSolutionAttempts(technicalEntryId, queryParams),

    // The route may not have provided the ID yet while the page is loading.
    enabled: Boolean(technicalEntryId),
  });
}

import { useTechnicalEntries } from "@/features/technical-entry/hooks/use-technical-entries";
import type { ListTechnicalEntriesParams } from "@/features/technical-entry/types/technical-entry";

export type KnowledgeQuery = ReturnType<typeof useTechnicalEntries>;

export function useKnowledgeOverview(projectId?: string) {
  const scope = {
    page: 1,
    archivedAt: "null",
    ...(projectId ? { projectId } : {}),
  } satisfies ListTechnicalEntriesParams;

  // Count requests use meta.total, never the number of records in a page.
  // Keeping queries independent lets one block fail without hiding the rest.
  // All five retain the journal's query-key prefix and mutation invalidations.
  const learnings = useTechnicalEntries({
    ...scope,
    perPage: 1,
    type: "LEARNING",
  });
  const openIssues = useTechnicalEntries({
    ...scope,
    perPage: 1,
    type: "ISSUE",
    status: "OPEN",
  });
  const resolvedIssues = useTechnicalEntries({
    ...scope,
    perPage: 1,
    type: "ISSUE",
    status: "RESOLVED",
  });
  const recentLearnings = useTechnicalEntries({
    ...scope,
    perPage: 5,
    type: "LEARNING",
    sort: "createdAt",
    sortDir: "desc",
  });
  const recentResolvedIssues = useTechnicalEntries({
    ...scope,
    perPage: 5,
    type: "ISSUE",
    status: "RESOLVED",
    sort: "resolvedAt",
    sortDir: "desc",
  });

  return {
    learnings,
    openIssues,
    resolvedIssues,
    recentLearnings,
    recentResolvedIssues,
  };
}

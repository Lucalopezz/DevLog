# Knowledge Overview

The authenticated `/knowledge-overview` page describes the composition of the
current journal: learnings, open issues, resolved issues, and the share of issues
that are currently resolved. It includes entries without projects and excludes
archived entries. Archiving or deleting entries removes them from this view.

See the [overview flow diagrams](../diagrams/frontend/knowledge-overview.md)
for query composition, derived issue statistics, and journal navigation.

## Queries and derived data

`useKnowledgeOverview(projectId)` composes five independent queries against the
existing `GET /technical-entry` endpoint. Every request includes `page=1`,
`archivedAt=null`, and the selected `projectId` when present.

| Block | Additional parameters | Value used |
| --- | --- | --- |
| Learnings | `perPage=1`, `type=LEARNING` | `meta.total` |
| Open issues | `perPage=1`, `type=ISSUE`, `status=OPEN` | `meta.total` |
| Resolved issues | `perPage=1`, `type=ISSUE`, `status=RESOLVED` | `meta.total` |
| Recent learnings | `perPage=5`, `type=LEARNING`, `sort=createdAt`, `sortDir=desc` | `data` |
| Recently resolved issues | `perPage=5`, `type=ISSUE`, `status=RESOLVED`, `sort=resolvedAt`, `sortDir=desc` | `data` |

Totals come from server metadata, not the length of a loaded page. The resolved
share is `resolved / (open + resolved)`. It is derived only after both issue-total
queries succeed; with zero issues the page shows `—` and an explanation rather
than implying that a percentage exists. Percentages use `en-US` with up to one
decimal place. Dates use `en-US` in the browser's local time zone.

The composition bar uses an accessible meter with numeric values and a textual
description. The visible legend also gives both totals, so understanding the
result does not depend on color. It measures the current collection rather than
productivity, a goal, or a historical trend. A reopened issue leaves the resolved
list; resolving it again uses its current `resolvedAt` timestamp.

## State and navigation

- `projectId` in the URL is the source of truth for the project selector, all
  five queries, and all links to the journal. Reload and Back/Forward preserve it.
- The shared `useProjectOptions` query supplies all project options, including
  archived projects whose active entries can still appear in the journal.
- The journal list now applies `projectId` from the URL and shows a scope banner.
  Searching and pagination preserve it; **Show all projects** clears only that
  scope and resets pagination. The existing **Clear** action clears all filters.
- Queries reuse `technicalEntriesKeys.list`, so existing journal mutations
  invalidate the overview without adding a second synchronization mechanism.

Each block owns its loading, empty, error, and retry state. A failed query never
becomes a fictitious zero. A failed issue total also hides the derived percentage
and meter. Even after a failed background refresh, its previously cached total
is not presented as a successful current result. Other successful blocks remain
usable, and retry refetches only the failed query. Project-option failures are
independent of journal queries.

Five small requests are a deliberate frontend-only trade-off: this avoids new
backend endpoints and incomplete client-side aggregation, at the cost of more
requests and no atomic snapshot across totals. Changes happening during requests
can briefly produce totals from different moments. Query invalidation refreshes
the view after in-app mutations. Rankings, monthly trends, and historical events
would need additional backend support.

## Validation and study notes

Component tests check the request contracts, metadata totals, 0%/100%/fractional
ratios, no-issue handling, independent failures/retries, background errors,
project changes, and project-scoped journal navigation. Mutation integration
tests cover resolve, reopen, archive, and delete. Browser tests exercise desktop
and mobile layouts, keyboard links, navigation history, and local resolution
dates in `America/Sao_Paulo`.

Key concepts to study: server metadata versus loaded records, derived state,
query-key invalidation, independent asynchronous state, URL-based filters, and
current-state statistics versus historical analytics.

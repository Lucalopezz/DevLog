# Activity Timeline

The authenticated `/activity-timeline` page explores the current journal by
creation date. It includes issues and learnings, including entries without a
project, and excludes archived entries. Deleting or archiving an entry removes
it from this view. Issue badges describe the **current status**; this is not an
audit log of edits, resolutions, or reopenings.

## Data flow

1. The URL stores `projectId` and `type`. The controls apply changes immediately,
   and browser Back/Forward restores the selected filters.
2. `useActivityTimeline` calls the existing `GET /technical-entry` endpoint with
   `perPage=20`, `archivedAt=null`, `sort=createdAt`, and `sortDir=desc`.
3. `useInfiniteQuery` owns the page numbers and uses `meta.currentPage` and
   `meta.lastPage` to decide whether another page exists. Each filter combination
   has its own cache entry: new combinations start at page one, while revisiting
   a combination can reuse its previously loaded pages.
4. The page flattens the loaded responses, then passes the entries to the pure
   `groupEntriesByDay` function. Grouping each response separately would repeat
   a day heading when that day spans two pages.
5. Day keys use local calendar dates rather than UTC string slices. Headings
   and times use the browser's time zone and English (`en-US`) formatting.

The infinite query lives under `technicalEntriesKeys.lists()` with a distinct
`infinite` segment. This prevents its `{ pages, pageParams }` data from colliding
with a regular list response while letting the existing journal mutations
invalidate both representations. Creation, edits, tags, archive, restore,
deletion, and project deletion therefore reuse the existing cache refresh flow.

The entry response contains a project ID, not a name. `useProjectOptions`, shared
with Environments, fetches all project pages to populate the filter and resolve
names. Archived projects remain available because an active entry can still
belong to one. Only the **entry's** archive state controls timeline inclusion.
Fetching all projects is a simple trade-off for this version; a large workspace
would benefit from searchable project options and names supplied with entries.

## Loading and failures

- Initial loading has an announced status; a successful empty response has a
  dedicated empty state. An error never becomes an empty result.
- `Load more` keeps pagination explicit and keyboard accessible. It is disabled
  while any timeline request is running, preventing overlapping loads/refetches.
- A failed next page leaves earlier entries visible and retries that page.
- A failed refresh keeps cached entries visible with an explicit stale-data
  message and requires a successful retry before loading more.
- Project metadata has its own loading/error/retry state. A missing project name
  is distinct from an entry that has no project.

The existing API uses page numbers rather than a cursor or snapshot. Concurrent
inserts/deletes can shift page boundaries. Grouping removes repeated entry IDs,
but cannot guarantee a complete historical snapshot or recover omitted records
without a refresh. The page deliberately provides no date-range filter over a
partially loaded collection.

## Validation

Component tests exercise filters, pagination, project lookup, initial failures,
next-page failures, and failed background refreshes. The journal cache integration
test includes the timeline in its create/edit/archive/restore/delete flow.
Playwright tests use `America/Sao_Paulo` to verify UTC instants around local
midnight, day continuity across pages, keyboard navigation, and mobile layout.

Useful concepts to study here are query-key hierarchies, infinite-query cache
shape, server state versus URL state, pure transformations, and the difference
between an instant in time and a local calendar day.

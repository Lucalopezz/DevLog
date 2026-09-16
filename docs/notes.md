<!--
  This document is intentionally practical. It describes the next frontend
  implementation slice for tags and uses the current DevLog file structure.
-->

# Frontend tag implementation guide

The tag library already exists in the web application:

- `/tags` can list, search, create, and delete tags;
- `TagBadge` renders a shared tag visual;
- `TagSelector` can search and select multiple tag IDs;
- technical entries already receive and display their assigned tags.

The missing part is the persistent relationship between a technical entry and
its tags. The backend already exposes the relationship endpoints:

```text
POST   /api/technical-entry/:entryId/tags
DELETE /api/technical-entry/:entryId/tags/:tagId
```

This guide implements the work in the following order:

1. Add frontend API clients for assigning and removing tags.
2. Add React Query mutations and cache synchronization.
3. Add tag selection to the entry-creation flow.
4. Add tag editing to the entry-detail flow.
5. Add focused tests and run the frontend checks.
6. Add filtering by tag after the backend exposes a `tagId` search parameter.

The examples use the existing React, TypeScript, Axios, TanStack Query, React
Hook Form, Zod, and Vitest conventions in `apps/web`.

## 0. Establish the current data flow

Before changing code, keep this relationship in mind:

```text
TagSelector
    |
    | selected tag IDs
    v
Entry form or entry-detail container
    |
    | entry ID + tag ID
    v
POST /technical-entry/:entryId/tags
    |
    v
TechnicalEntry.tags returned by GET /technical-entry/:id
```

`TagSelector` is intentionally controlled. It does not own the selected IDs;
the parent provides `value` and receives changes through `onChange`:

```tsx
<TagSelector
  value={tagIds}
  onChange={setTagIds}
/>
```

This matters because the parent must decide whether a change is only local
form state or a persisted API mutation. The selector should not know whether
it is being used while creating an entry or editing an existing entry.

Relevant existing files:

- `apps/web/src/features/tags/components/tag-selector.tsx`
- `apps/web/src/features/technical-entry/components/technical-entry-form.tsx`
- `apps/web/src/features/technical-entry/pages/technical-entry-detail-page.tsx`
- `apps/web/src/features/technical-entry/api/get-technical-entry.ts`
- `apps/web/src/features/technical-entry/api/list-technical-entries.ts`

## 1. Add the relationship API clients

Create two files beside the other technical-entry API functions.

### 1.1 Assign a tag

Create `apps/web/src/features/technical-entry/api/assign-tag-to-technical-entry.ts`:

```ts
import { api } from "@/api/http";
import type { Tag } from "@/features/tags/types/tag";

export type AssignTagInput = {
  technicalEntryId: string;
  tagId: string;
};

export async function assignTagToTechnicalEntry(
  input: AssignTagInput,
): Promise<Tag> {
  const { data } = await api.post<Tag>(
    `/technical-entry/${input.technicalEntryId}/tags`,
    { tagId: input.tagId },
  );

  return data;
}
```

The path contains the entry ID, while the request body contains the tag ID.
Do not send the user ID from the browser; the API gets it from the session.

### 1.2 Remove a tag

Create `apps/web/src/features/technical-entry/api/remove-tag-from-technical-entry.ts`:

```ts
import { api } from "@/api/http";

export type RemoveTagInput = {
  technicalEntryId: string;
  tagId: string;
};

export async function removeTagFromTechnicalEntry({
  technicalEntryId,
  tagId,
}: RemoveTagInput): Promise<void> {
  await api.delete(
    `/technical-entry/${technicalEntryId}/tags/${tagId}`,
  );
}
```

The endpoint returns HTTP 204, so the function should not try to unwrap a
response body.

### 1.3 Add API contract tests

Extend
`apps/web/src/features/technical-entry/api/technical-entry-api.spec.ts`.
The important assertions are the HTTP method, URL, request body, and handling
of the empty 204 response:

```ts
it("assigns a tag to an entry", async () => {
  const entryId = "11111111-1111-4111-8111-111111111111";
  const tag = createTagFixture();
  let body: unknown;

  server.use(
    http.post(
      apiUrl(`/technical-entry/${entryId}/tags`),
      async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(tag, { status: 201 });
      },
    ),
  );

  await expect(
    assignTagToTechnicalEntry({
      technicalEntryId: entryId,
      tagId: tag.id,
    }),
  ).resolves.toEqual(tag);

  expect(body).toEqual({ tagId: tag.id });
});

it("removes a tag from an entry", async () => {
  const entryId = "11111111-1111-4111-8111-111111111111";
  const tagId = "22222222-2222-4222-8222-222222222222";

  server.use(
    http.delete(
      apiUrl(`/technical-entry/${entryId}/tags/${tagId}`),
      () => new HttpResponse(null, { status: 204 }),
    ),
  );

  await expect(
    removeTagFromTechnicalEntry({
      technicalEntryId: entryId,
      tagId,
    }),
  ).resolves.toBeUndefined();
});
```

Use the existing factory and MSW setup from the test file instead of creating
a second HTTP test infrastructure.

## 2. Add mutations and synchronize the cache

The API functions perform requests. Hooks should own mutation feedback and
cache invalidation. This keeps components focused on rendering and user
interaction.

### 2.1 Create one invalidation helper

Create
`apps/web/src/features/technical-entry/hooks/invalidate-technical-entry-queries.ts`:

```ts
import type { QueryClient } from "@tanstack/react-query";
import { projectDetailKeys } from "@/features/projects/api/list-project-details";
import { getTechnicalEntryQueryKey } from "../api/get-technical-entry";
import { technicalEntriesKeys } from "../api/list-technical-entries";

export async function invalidateTechnicalEntryQueries(
  queryClient: QueryClient,
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
```

There are three consumers of the same relationship:

1. the entry-detail query;
2. global technical-entry lists;
3. project technical-entry lists, when the entry belongs to a project.

Invalidating all three prevents a stale badge from appearing in one part of
the application after the user changes it in another part.

### 2.2 Assign mutation

Create `apps/web/src/features/technical-entry/hooks/use-assign-tag.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { assignTagToTechnicalEntry } from "../api/assign-tag-to-technical-entry";
import { invalidateTechnicalEntryQueries } from "./invalidate-technical-entry-queries";

export type AssignTagMutationInput = {
  technicalEntryId: string;
  tagId: string;
  projectId?: string;
};

export function useAssignTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ technicalEntryId, tagId }: AssignTagMutationInput) =>
      assignTagToTechnicalEntry({ technicalEntryId, tagId }),

    onSuccess: async (_tag, { technicalEntryId, projectId }) => {
      toast.success("Tag assigned successfully.");
      await invalidateTechnicalEntryQueries(
        queryClient,
        technicalEntryId,
        projectId,
      );
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Could not assign the tag. Try again."),
      );
    },
  });
}
```

The mutation variable includes `projectId` even though the assignment API does
not need it. It is query context used only to refresh the project page.

### 2.3 Remove mutation

Create `apps/web/src/features/technical-entry/hooks/use-remove-tag.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { removeTagFromTechnicalEntry } from "../api/remove-tag-from-technical-entry";
import { invalidateTechnicalEntryQueries } from "./invalidate-technical-entry-queries";

export type RemoveTagMutationInput = {
  technicalEntryId: string;
  tagId: string;
  projectId?: string;
};

export function useRemoveTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ technicalEntryId, tagId }: RemoveTagMutationInput) =>
      removeTagFromTechnicalEntry({ technicalEntryId, tagId }),

    onSuccess: async (_value, { technicalEntryId, projectId }) => {
      toast.success("Tag removed successfully.");
      await invalidateTechnicalEntryQueries(
        queryClient,
        technicalEntryId,
        projectId,
      );
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Could not remove the tag. Try again."),
      );
    },
  });
}
```

Start with server-state invalidation instead of optimistic updates. It is
slightly less instantaneous, but it gives a simpler and safer first version:
the API remains the source of truth, and failed requests do not require manual
rollback logic.

## 3. Add tags to the create-entry flow

The current create endpoint does not accept tags inside its payload. The
correct frontend sequence is therefore:

```text
1. Create the technical entry.
2. Receive the new entry ID.
3. Assign each selected tag using the relationship endpoint.
4. Refresh the entry/list queries.
```

Do not add `tagIds` to `CreateTechnicalEntryInput` unless the backend contract
is changed too. Keeping the client type aligned with the API prevents a
payload that TypeScript accepts but the server ignores.

### 3.1 Keep selected IDs in the form container

In `technical-entry-form.tsx`, add local state beside the form and mutation:

```tsx
import { useState } from "react";
import { TagSelector } from "@/features/tags/components/tag-selector";
import { useAssignTag } from "../hooks/use-assign-tag";

// Inside TechnicalEntryForm:
const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
const assignTagMutation = useAssignTag();
```

Render the selector inside the existing `<form>`, after the type field or
before the footer:

```tsx
<TagSelector
  disabled={isLoading}
  onChange={setSelectedTagIds}
  value={selectedTagIds}
/>
```

The selector is not registered as a React Hook Form field in this first
version. That is acceptable because the IDs are submission state, not a value
sent in the create request. If the form later becomes more complex, you can
move the IDs into a Zod field and use `Controller`.

### 3.2 Assign tags after creation

Capture the created entry returned by `mutateAsync` and assign the selected
tags:

```tsx
const onSubmit: SubmitHandler<CreateTechnicalEntryFormValues> = async (
  data,
) => {
  const conclusion = optionalText(data.conclusion ?? "");
  const input: CreateTechnicalEntryInput = {
    title: data.title,
    context: data.context,
    type: data.type,
    ...(projectId ? { projectId } : {}),
    ...(conclusion ? { conclusion } : {}),
  };

  try {
    const entry = await createMutation.mutateAsync(input);

    const results = await Promise.allSettled(
      selectedTagIds.map((tagId) =>
        assignTagMutation.mutateAsync({
          technicalEntryId: entry.id,
          tagId,
          projectId: entry.projectId,
        }),
      ),
    );

    const failedAssignments = results.filter(
      (result) => result.status === "rejected",
    );

    if (failedAssignments.length > 0) {
      // The entry already exists, so do not pretend the whole operation
      // failed. The user can retry the missing assignments from its detail.
      toast.error(
        "The entry was created, but some tags could not be assigned.",
      );
    }

    form.reset();
    setSelectedTagIds([]);
    onOpenChange(false);
  } catch {
    // The create mutation owns the API error toast and keeps the dialog open.
  }
};
```

Import `toast` from `sonner` for the partial-assignment message.

Why `Promise.allSettled` instead of `Promise.all`? Entry creation and tag
assignment are separate HTTP operations. If the third assignment fails after
the first two succeed, `Promise.all` would reject immediately and hide the
fact that the entry was created. `Promise.allSettled` lets the UI report the
partial result honestly.

For a future version, a backend command could create the entry and all
relationships atomically. That would be a different API design and is not
needed for this frontend increment.

### 3.3 Reset local tag state when the dialog closes

Avoid reopening the create dialog with tags from a previous draft. Route the
dialog callback through a small wrapper:

```tsx
function handleOpenChange(nextOpen: boolean) {
  if (!nextOpen) {
    form.reset();
    setSelectedTagIds([]);
  }

  onOpenChange(nextOpen);
}
```

Then use `handleOpenChange` for `Dialog` and for the cancel button. Keep the
reset after a successful submit as well; it makes the state explicit and
protects the component if the dialog implementation changes later.

## 4. Add tag editing to the entry detail page

The detail page currently renders tags as read-only list items. Replace that
display with a small controlled container that translates selector changes
into one add or remove request.

### 4.1 Compute the selected IDs

The server returns full tag objects, while `TagSelector` works with IDs:

```tsx
const selectedTagIds = entry.tags?.map((tag) => tag.id) ?? [];
```

For a first implementation, create a feature-local component such as
`technical-entry-tags-editor.tsx`. This keeps API mutation logic out of the
page layout.

### 4.2 Translate a selector change into a relationship mutation

Illustrative component:

```tsx
import { useEffect, useState } from "react";
import { TagSelector } from "@/features/tags/components/tag-selector";
import type { TechnicalEntry } from "../types/technical-entry";
import { useAssignTag } from "../hooks/use-assign-tag";
import { useRemoveTag } from "../hooks/use-remove-tag";

type Props = {
  entry: TechnicalEntry;
};

export function TechnicalEntryTagsEditor({ entry }: Props) {
  const serverTagIds = entry.tags?.map((tag) => tag.id) ?? [];
  const [tagIds, setTagIds] = useState(serverTagIds);
  const assignMutation = useAssignTag();
  const removeMutation = useRemoveTag();

  // React Query refetches the entry after a mutation. Synchronize the local
  // controlled value with that new server snapshot.
  useEffect(() => {
    setTagIds(serverTagIds);
  }, [entry.tags]);

  async function handleChange(nextTagIds: string[]) {
    const previous = new Set(tagIds);
    const next = new Set(nextTagIds);
    const addedTagId = nextTagIds.find((id) => !previous.has(id));
    const removedTagId = tagIds.find((id) => !next.has(id));

    // TagSelector changes one item at a time, so one of these branches should
    // run for each interaction.
    setTagIds(nextTagIds);

    try {
      if (addedTagId) {
        await assignMutation.mutateAsync({
          technicalEntryId: entry.id,
          tagId: addedTagId,
          projectId: entry.projectId,
        });
      }

      if (removedTagId) {
        await removeMutation.mutateAsync({
          technicalEntryId: entry.id,
          tagId: removedTagId,
          projectId: entry.projectId,
        });
      }
    } catch {
      // Restore the last known server value if the relationship request fails.
      setTagIds([...previous]);
    }
  }

  return (
    <TagSelector
      disabled={assignMutation.isPending || removeMutation.isPending}
      onChange={(nextTagIds) => void handleChange(nextTagIds)}
      value={tagIds}
    />
  );
}
```

The local state gives immediate feedback, while the invalidation helper
eventually replaces it with the server response. Disabling the selector while
a request is pending avoids two quick clicks racing against each other.

### 4.3 Render the editor in the detail page

Import the new component and replace the current read-only section:

```tsx
<section className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm">
  <TechnicalEntryTagsEditor entry={entry} />
</section>
```

Keep the existing read-only tag presentation in list cards. The selector is
appropriate for the detail page because that is where the user edits the
entry; list cards should remain compact.

One product decision remains: whether archived entries should be editable.
The current backend allows tag assignment/removal for archived entries. The
frontend can therefore leave the selector enabled, or disable it if the
product wants archived entries to be read-only. Make that rule explicit in
the component rather than relying on a hidden API failure.

## 5. Check cache invalidation after deleting a tag

Deleting a tag removes its relationships in the backend. The existing
`useDeleteTag` hook already invalidates tag lists and technical-entry queries,
but project detail entry collections must also be refreshed.

Because the delete mutation receives only a tag ID and not the projects that
use that tag, invalidate the project-detail prefix:

```ts
await Promise.all([
  queryClient.invalidateQueries({
    queryKey: tagKeys.lists(),
  }),
  queryClient.invalidateQueries({
    queryKey: technicalEntriesKeys.lists(),
  }),
  queryClient.invalidateQueries({
    queryKey: ["technical-entry"],
  }),
  queryClient.invalidateQueries({
    queryKey: ["project"],
  }),
]);
```

The broad `project` invalidation is acceptable for a rare destructive action.
It avoids stale tags in any currently cached project page. For assignment and
removal, prefer the narrower `projectDetailKeys.technicalEntriesRoot(projectId)`
invalidation because the caller knows the entry's project.

## 6. Add tests for the user-visible relationship flow

At minimum, cover these cases:

### API client tests

- assignment uses `POST` and sends `{ tagId }`;
- removal uses `DELETE` and accepts `204`;
- server validation errors are propagated.

### Selector tests

- selecting a tag adds its ID;
- selecting it again removes its ID;
- creating a tag selects the returned tag ID;
- search does not remove already-selected tags from the selected list.

### Entry integration tests

- creating an entry with two tags creates the entry first and then sends two
  assignment requests;
- a failed assignment reports that the entry was created but not fully tagged;
- removing a tag calls the delete relationship endpoint;
- the selector is disabled while a relationship request is pending.

Use MSW handlers rather than mocking Axios directly. This tests the same HTTP
contract that the browser uses.

Run the smallest relevant checks while developing:

```bash
pnpm --filter web test -- src/features/technical-entry/api/technical-entry-api.spec.ts
pnpm --filter web lint
pnpm --filter web build
```

Then run the complete frontend suite:

```bash
pnpm --filter web test
pnpm --filter web lint
pnpm --filter web build
```

## 7. Add filtering by tag only after the API supports it

The current frontend `ListTechnicalEntriesParams` has no `tagId`, and the
backend search DTO/use case also does not accept one. Do not filter only the
currently loaded page in the browser: that gives incorrect results when
pagination is active.

First, the backend must add `tagId` to its search contract and filter entries
through the `TechnicalEntryTag` relationship. After that contract exists,
update the frontend in four places.

### 7.1 Add `tagId` to the frontend query type

In `technical-entry.ts`:

```ts
export type ListTechnicalEntriesParams = {
  // existing fields...
  tagId?: string;
};

export type TechnicalEntrySearchFormValues = {
  title: string;
  type: TechnicalEntryType | "";
  status: TechnicalEntryStatus | "";
  tagId: string;
};
```

### 7.2 Load tag options in the filter

Reuse `useTags` rather than duplicating the tag API call. The filter can use a
small page sorted by name:

```tsx
const { data: tags } = useTags({
  page: 1,
  perPage: 100,
  sort: "name",
  sortDir: "asc",
});
```

Render a select with an empty option for “All tags”, and return `tagId` from
the filter form.

### 7.3 Persist the filter in the URL

Follow the existing title/type/status pattern in
`technical-entries-page.tsx`:

```tsx
const tagId = searchParams.get("tagId") || undefined;

const params = {
  ...defaultTechnicalEntryParams,
  page,
  ...(tagId ? { tagId } : {}),
};
```

When the user changes the tag, delete the old `tagId`, set the new value, and
reset `page` to `1`. URL state keeps refresh, browser navigation, and shared
links predictable.

### 7.4 Add filter tests

Verify that:

- the selected tag is sent as a query parameter;
- changing the tag resets pagination;
- clearing filters removes `tagId` from the URL;
- invalid or unknown tag IDs do not break the page.

## Completion checklist

Use this checklist while implementing:

- [ ] Add assign/remove API clients.
- [ ] Add MSW contract tests for both clients.
- [ ] Add the shared entry-query invalidation helper.
- [ ] Add assign/remove React Query mutations.
- [ ] Add `TagSelector` to the create-entry form.
- [ ] Create the entry before assigning its selected tags.
- [ ] Handle partial assignment failure explicitly.
- [ ] Add editable tags to the entry-detail page.
- [ ] Refresh global and project entry lists after changes.
- [ ] Refresh project detail caches after tag deletion.
- [ ] Add component/integration tests.
- [ ] Run frontend tests, lint, and build.
- [ ] Implement the tag filter only after the backend supports `tagId`.

# Guided tutorial: the first Projects frontend version

This is the next recommended exercise for the DevLog frontend.

Or resume the conversation about documenting the projects feature.

## Exercise goal

Implement the first project screen as a complete vertical
slice:

1. Create a project;
2. List projects owned by the authenticated user;
3. Search by name;
4. Filter by status;
5. Paginate results;
6. Show loading, error, and empty-list states;
7. Add the private `/projects` route and sidebar link.

Do not implement all of Projects at once. The API also has details,
technologies, commands, resources, archiving, restoration, editing, and deletion.
These will be subsequent slices of the same feature.

This order is educational: the first delivery teaches the most
important remote-data frontend cycle:

```text
Form
  → local validation
  → HTTP mutation
  → API response
  → cache invalidation
  → new list query
  → updated interface
```

Afterward, you will have a useful feature and a foundation reusable in
Tags and Technical Entries.

## Scope decision

### Included now

- Private `/projects` route;
- Query through `GET /api/project`;
- Creation through `POST /api/project`;
- Name and status filters;
- A default filter showing only unarchived projects;
- Pagination using API `meta`;
- A form with required `name` and optional `description`.

### Deferred

- `/projects/:id` detail page;
- Editing;
- Archiving, restoration, and deletion;
- Technologies;
- Commands;
- Resources;
- Search debouncing;
- Automated frontend tests once a test runner is configured.

This separation avoids tackling two difficulties together: first learn
listing and mutations, then relationships between resources and actions on a
specific resource.

## Before coding: read the existing contract

Check these files before starting:

- `apps/api/src/project/infrastructure/project.controller.ts`;
- `apps/api/src/project/infrastructure/dto/project/create-project.dto.ts`;
- `apps/api/src/project/infrastructure/dto/project/search-project.dto.ts`;
- `apps/api/src/project/infrastructure/presenter/project/project.presenter.ts`;
- `apps/api/src/project/domain/entities/project/project-status-enum.ts`;
- `docs/usecases/projects.md`;
- `docs/guides/frontend_structure.md`.

The backend is ready. The frontend only needs to represent that
contract without duplicating server-owned rules.

### First-stage endpoints

| Operation | Endpoint | Body or parameters |
| --- | --- | --- |
| List | `GET /api/project` | `page`, `perPage`, `name`, `status`, `archivedAt`, `sort`, `sortDir` |
| Create | `POST /api/project` | `{ name, description? }` |

The frontend `api` already has a `baseURL` including `/api` and
`withCredentials: true`. Feature functions should therefore call
`/project`, without repeating `/api` or configuring cookies again.

### List response

The API returns a collection with this conceptual shape:

```ts
{
  data: Project[],
  meta: {
    currentPage: number,
    perPage: number,
    lastPage: number,
    total: number
  }
}
```

`data` contains projects. `meta` contains pagination information.
Do not calculate page count in the component: the backend already
calculates `lastPage` from the total item count.

### Model received by the frontend

The backend presenter returns these fields, among others:

```ts
type Project = {
  id: string
  name: string
  description?: string
  status: 'ACTIVE' | 'INACTIVE' | 'FINISHED'
  localPath?: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
}
```

Initially type JSON dates in the frontend as
`string`. The browser receives ISO text; convert to `Date` only
when presentation requires date formatting or comparison.

Status values belong to the API domain. English labels, colors, and
icons are presentation choices and belong in a file such as
`presentation.ts`, outside the HTTP function.

## Step 1 — create the feature structure

Create only the directories and files the first version actually needs:

```text
apps/web/src/features/projects/
├── api/
│   ├── create-project.ts
│   └── list-projects.ts
├── components/
│   ├── project-form.tsx
│   └── project-list.tsx
├── hooks/
│   ├── use-create-project.ts
│   └── use-projects.ts
├── pages/
│   └── projects-page.tsx
├── presentation.ts
├── schemas/
│   └── project.schema.ts
└── types/
    └── project.ts
```

The separation is intentional:

- `api/` knows HTTP URLs and payloads;
- `hooks/` connects the API to React Query;
- `schemas/` knows form validation;
- `components/` knows the Projects interface;
- `pages/` composes the screen and interacts with the route;
- `presentation.ts` maps domain values to the interface;
- `types/project.ts` keeps feature-specific contracts;
- `api/types.ts` keeps generic transport contracts such as pagination.

Do not call Axios directly in `ProjectsPage`. That would make the
page responsible for transport, caching, and query rules together.

### Checkpoint

Files may be empty at this point. What matters is being able to
explain why each responsibility belongs in its directory.

## Step 2 — model frontend types

In `features/projects/types/project.ts`, declare:

1. The `ProjectStatus` union with `ACTIVE`, `INACTIVE`, and `FINISHED`;
2. The `Project` type received from the API;
3. The `ProjectCollection` type, reusing the global `Pagination<T>` from
   `@/api/types`;
4. The search parameter type;
5. The creation payload type.

Use frontend-owned types instead of importing backend classes.
Frontend and backend are separate applications; sharing an entity
class would couple layers and could expose internal domain rules
to the browser.

One way to think about the contracts:

```text
Project                 ← a resource
ProjectCollection       ← paginated response
ListProjectsParams      ← query input
CreateProjectInput      ← mutation input
```

Include only fields needed now, while keeping the type
compatible with the API response. `description` and `localPath` may be
optional; `archivedAt` may be absent on an unarchived project.

## Step 3 — centralize status text and presentation

In `features/projects/presentation.ts`, create a map for each status:

```text
ACTIVE   → Active
INACTIVE → Inactive
FINISHED → Finished
```

You can also define a visual class for each:

```text
ACTIVE   → positive appearance
INACTIVE → neutral appearance
FINISHED → informational appearance
```

The component should consult this map instead of scattering ternaries such as
`status === 'ACTIVE'` across the screen.

This distinction matters: `ACTIVE` is a domain value; “Active” is
an interface language choice. If the API changes or another language is
added, the change stays in presentation.

## Step 4 — implement the list HTTP function

In `features/projects/api/list-projects.ts`:

1. Import `api` from `@/api/http`;
2. Import the feature types;
3. Create an asynchronous `listProjects(params)` function;
4. Call `api.get<ProjectCollection>('/project', { params })`;
5. Return only `response.data`.

Do not request data on component mount with `useEffect`. Reading is
React Query's responsibility because it supplies caching, deduplication,
loading, errors, and refetching.

### Suggested initial parameters

For the first call, send:

```text
page=1
perPage=10
archivedAt=null
sort=createdAt
sortDir=desc
```

The backend DTO interprets the string `null` as the filter
`archivedAt: null`, so the main screen shows unarchived projects.
Omitting this parameter may return archived and unarchived projects
together, because an absent filter has a different meaning.

Status can initially be omitted. The list then shows active, inactive,
and finished projects, provided they are not archived.

## Step 5 — define query keys and create `useProjects`

In the same API file or a small `projects.keys.ts`, define a
key hierarchy:

```text
projects
└── lists
    └── list(params)
```

The list key must include search parameters. React Query must
understand that these are different queries:

```text
['projects', 'list', { page: 1, name: 'api' }]
['projects', 'list', { page: 2, name: 'api' }]
```

In `hooks/use-projects.ts`:

1. Use `useQuery` from `@tanstack/react-query`;
2. Receive parameters as an argument;
3. Use the key containing those parameters;
4. Pass `listProjects` as `queryFn`;
5. Return the React Query object.

The component does not need to know whether data came from cache or the network.
It only observes `data`, `isPending`, `isError`, `error`, and `refetch`.

### Why are parameters part of the key?

If the key were only `['projects']`, searching for “api” might incorrectly reuse
the response for “web”. The key represents query identity,
not just the resource name.

## Step 6 — configure the private route

Update `apps/web/src/routes/router.tsx`:

1. Import `ProjectsPage`;
2. Inside the branch already using `loader: requireUser`, add:

```tsx
{
  path: 'projects',
  Component: ProjectsPage,
}
```

Do not create another guard inside the page. The route already has
`requireUser` protection. Remember that this is a UX and navigation
boundary; the backend `AuthGuard` actually protects the data.

The flow becomes:

```text
Access /projects
  → requireUser checks the session
  → valid session: render ProjectsPage
  → invalid session: redirect to /login
```

## Step 7 — add the sidebar link

In `apps/web/src/components/app-sidebar.tsx`:

1. Choose a `lucide-react` icon, such as `FolderKanban`;
2. Import the icon;
3. Add a `SidebarLink` to `/projects` in the authenticated menu;
4. Confirm the link is inside the branch shown only to authenticated
   users.

The link should use `NavLink`, like the Home item. React Router then reports
when the route is active, and the sidebar applies the matching style.

Do not duplicate authentication logic in the sidebar. `useGetUser` decides
what to show; the loader remains the route boundary.

## Step 8 — build the list screen before the form

Implement `features/projects/pages/projects-page.tsx` in small parts.

### 8.1 Header

Create a `main` or `section` with:

- A Projects title;
- Text explaining that these are the user's projects;
- A New project button or visible creation area.

For now, the form can stay visible below the header. This
reduces initial scope. Converting it to a modal or drawer is a
later refinement.

### 8.2 Query state

Call `useProjects` with the current parameters. There are two ways to store
these parameters:

- Local `useState`, simpler for a first implementation;
- A query string through `useSearchParams`, recommended for this screen.

Use `useSearchParams` to allow reloading, sharing, and navigating the search
through browser back/forward buttons. In this model, the URL is
the source of truth:

```text
/projects?name=api&status=ACTIVE&page=1
```

Convert URL values to expected types before calling the hook. For
example, convert `page` to a number and treat an unknown status
as absent.

A practical strategy keeps filter fields as a local draft and
applies the search only when the filter form is submitted.
Reset to `page=1` when applying a new filter; otherwise, the user might
remain on page 4 of a previous search and get an empty page for the new one.

### 8.3 Asynchronous states

Render each state explicitly:

1. `isPending`: skeletons or a Loading projects... message;
2. `isError`: a clear message and a Try again button using
   `refetch`;
3. Response without items: an empty state inviting the user to create their first project;
4. Response with items: the project list;
5. Refetch after an existing query: keep data visible and,
   optionally, show a smaller update indicator.

Do not treat `isPending` and an empty list as the same state. `isPending` means
the result is still unknown; an empty list means the API responded and
found no items.

### 8.4 Project card or row

In `components/project-list.tsx`, render each project with:

- Name;
- Description, when present;
- A badge with the display status;
- Formatted creation or update date;
- Local path only when present.

Use `project.id` as `key`, not the array index. The ID represents
resource identity even when sorting or pagination changes.

For now, the card can be read-only. Do not add edit, archive, or delete
buttons before their mutations are implemented.

## Step 9 — implement pagination

Once the basic list works, add:

- A Previous button;
- A Next button;
- `Page X of Y` text;
- Optionally, the total project count.

Use `meta.currentPage` and `meta.lastPage`:

```text
Previous disabled when currentPage <= 1
Next disabled when currentPage >= lastPage
```

When changing pages, update only `page` in query parameters.
Keep `name`, `status`, `archivedAt`, `sort`, and `sortDir`; pagination belongs
to the same search and must not start an unfiltered search.

The backend uses `perPage` to calculate `lastPage`. The frontend should not
reimplement this by counting received items, since the current page
may have fewer items than the limit while other pages still exist.

## Step 10 — create the form schema

In `features/projects/schemas/project.schema.ts`, use Zod to represent
known rules before calling the API:

- `name`: required text, 3 to 150 characters;
- `description`: optional text.

These limits appear in backend `CreateProjectDto` and should be reflected
in the form for immediate feedback. Keep backend validation
because browsers can be bypassed and different clients may
consume the same API.

Use `zodResolver` with `useForm`, following
`features/auth/hooks/use-login-form.ts`.

The form flow is:

```text
Input controlled by React Hook Form
  → zodResolver
  → if valid, onSubmit receives typed data
  → mutation calls POST /api/project
```

Consider normalizing `name` with `trim()` before submission. This improves
the experience but does not replace backend validation. Deliberately decide
whether description whitespace should be preserved.

## Step 11 — implement `ProjectForm`

In `components/project-form.tsx`:

1. Create the form with `useForm` and the schema;
2. Wrap fields with the project `Form` component;
3. Use `FormInput` for name;
4. Use `FormField` + `FormControl` with a description `textarea`, or
   create a reusable `FormTextarea` only if the need appears in
   outras features;
5. Show `FormMessage` for each field;
6. Add a submit button;
7. Disable it while the mutation is pending;
8. Change its text to Creating... during submission;
9. Reset the form after success;
10. Let the page decide where the form is displayed.

`FormField` connects value, error, label, and accessibility.
Using only `useState` for values and separate `if` statements for errors
would duplicate responsibilities handled by React Hook Form + shadcn.

### Accessibility checks

Confirm in the browser that:

- Each label points to its input;
- Invalid fields receive `aria-invalid`;
- Error messages are associated through `aria-describedby`;
- The form works with keyboard only;
- The button communicates submission state and prevents repeated submissions.

The existing `FormLabel`, `FormControl`, and
`FormMessage` components already support these details.

## Step 12 — implement the creation HTTP function

In `features/projects/api/create-project.ts`:

1. Create a `createProject(input)` function;
2. Call `api.post<Project>('/project', input)`;
3. Return `response.data`.

The HTTP function should only handle API communication, without
toasts, navigation, or query invalidation. Interface effects belong to
the hook or component that owns the screen context.

## Step 13 — create `useCreateProject`

In `hooks/use-create-project.ts`, use `useMutation`.

### `mutationFn`

Pass `createProject` as `mutationFn`. This connects validated form
data to POST.

### `onSuccess`

After creation:

1. Invalidate project list queries;
2. Show `toast.success('Project created successfully!')`;
3. Let the component reset the form or report success
   through a callback;
4. Do not navigate to details yet, since that screen does not exist at this stage.

Invalidation is necessary because the old list is accurate only for
the moment before creation. Invalidating the list key makes React Query
refetch the server's authoritative sorting and pagination.

### `onError`

Use `getApiErrorMessage` with a fallback message, for example:

```text
Could not create the project. Try again.
```

The helper normalizes Nest errors, which can be a string or an
array of messages, so the hook does not need to know Axios details.

### Why invalidate instead of inserting manually?

You could use `queryClient.setQueryData` to put the new project at
the start of the list. This is immediate but requires manually maintaining sorting,
totals, and every affected page. In the first version, invalidation is
simpler and more reliable. After understanding the flow, study optimistic
updates and manual cache updates.

## Step 14 — connect form, page, and mutation

Decide where to instantiate the mutation hook. One clear option for study
is to instantiate it in the page and pass only what the form needs:

```text
ProjectsPage
  ├── useProjects(params)
  ├── useCreateProject()
  ├── ProjectForm(onSubmit, isPending)
  └── ProjectList(data)
```

The complete flow should be:

```text
User fills in name and description
  → ProjectForm validates with Zod
  → onSubmit passes valid data to the page
  → useCreateProject executes POST
  → API returns the created project
  → hook invalidates ['projects', 'lists']
  → useProjects repeats GET
  → list shows the new project
```

Do not call `window.location.reload()`. React Query already knows how to update
the interface parts that depend on modified data.

## Step 15 — handle filters without unnecessary requests

Add a separate filter form:

- Name input;
- Native status select with an All option;
- Search button;
- Clear button.

When searching:

1. Remove empty parameters;
2. Preserve `archivedAt=null`;
3. Set `page=1`;
4. Update the query string or chosen state;
5. Let parameter changes generate a new `queryKey`.

When clearing, return to the initial state. Do not add debouncing yet:
first understand parameters, query keys, and responses. Later, if search
runs on every keystroke, compare it with explicit form submission and
study debouncing carefully.

### Status handling

The empty select value means omit `status`. Do not send
`"ALL"`, because `ALL` is not part of the backend enum.

## Step 16 — validate behavior manually

With the API, database, and frontend running, verify:

### Session

- Guests accessing `/projects` are redirected to `/login`;
- Authenticated users can open `/projects`;
- The sidebar link appears only during a valid session.

### Listing

- Loading shows visual feedback;
- The list shows only unarchived projects by default;
- Status uses its English display label;
- Missing descriptions do not create awkward gaps;
- Empty lists have a useful message;
- Errors offer a retry;
- Pagination preserves filters.

### Creation

- An empty name shows a local error;
- A name shorter than 3 characters shows a local error;
- A name longer than 150 characters shows a local error;
- Description is optional;
- The button prevents multiple submissions while a request is pending;
- API errors appear in a toast;
- Success shows a toast and the new project appears without reloading the page.

### Network and cache

Use the configured React Query Devtools and the browser Network panel
to observe:

1. Which query key was created;
2. Which parameters were sent;
3. When the query becomes `pending`, `success`, or `error`;
4. Which request follows creation;
5. Whether the global Axios configuration sends the cookie.

This observation is part of the exercise. A screen that looks correct is not enough;
understand which events caused each change.

## Step 17 — technical validation

After implementing the first version, run from the root:

```bash
pnpm --filter web lint
pnpm --filter web build
```

Fix TypeScript and ESLint warnings before continuing. Pay particular attention to:
Check:

- `status` values from `URLSearchParams`, which are only strings;
- Optional fields that may be `undefined`;
- Unused imports;
- React components exported in the same file in a way incompatible with
  Fast Refresh;
- Query key names used inconsistently between query and mutation.

Since the frontend has no test runner yet, the minimum validation is
lint, build, and the manual checklist above.

## First-slice completion criteria

Projects is ready for the next stage when:

- `/projects` is a working private route;
- The list comes from the API and uses parameters correctly;
- Filters and pagination produce distinct React Query queries;
- Creation validates locally and sends the correct payload;
- The cache is invalidated after success;
- Loading, error, and empty states are distinct;
- The sidebar has the correct link;
- `pnpm --filter web lint` and `pnpm --filter web build` pass.

## Next steps after this stage

Once the first slice is stable, proceed in this order:

1. `GET /api/project/:id` and the `/projects/:id` page;
2. Project technologies;
3. Commands and resources, each as a small list + mutation;
4. Archiving and restoration;
5. Deletion with confirmation;
6. Improve pagination, debouncing, and cache updates.

Details should precede complex actions because they provide context for
technologies, commands, and resources. Repeat the same reasoning for
each new operation:

```text
API contract
  → type
  → HTTP function
  → query or mutation
  → component
  → asynchronous states
  → cache
  → manual validation
```

## Step 18 — update general project details

Generic updates should cover only the project's own scalar fields.
The frontend flow is distributed as follows:

```text
ProjectEditForm
  → useProjectEditForm + updateProjectSchema
  → useUpdateProject
  → updateProject
  → PATCH /api/project/:id
  → detail and list invalidation
```

`ProjectFormFields` groups shared name and description fields.
`ProjectForm` remains the creation wrapper and `ProjectEditForm` the
editing wrapper, reusing markup and accessibility without
mixing mutations or schemas from different operations.

Check the contract before creating the mutation:

| Field | Type | Behavior |
| --- | --- | --- |
| `name` | `string` | Replaces the name and remains required when supplied |
| `description` | `string \| null` | `null` clears the description |
| `status` | `ACTIVE \| INACTIVE \| FINISHED` | Changes the work state |
| `localPath` | `string \| null` | `null` clears the local path |

`PATCH` is partial: omission preserves the saved value. The edit form
may send all current general details, but the HTTP function must not
assume every consumer does so. This distinction prevents confusing
leave unchanged with clear.

Do not include `archivedAt` in the generic payload. Archiving and restoration
are lifecycle transitions with dedicated endpoints. Likewise, technologies,
commands, and resources are related entities and should keep using
their own mutations.

### Adding `localPath` to the form

1. Include `localPath` in input types and controlled
   form values.
2. Initialize it with `project.localPath ?? ''`; the interface uses
   an empty string for a visually empty field.
3. Render a `FormInput` labeled Local path. It connects the
   field to React Hook Form and associates its label, error, and accessibility.
4. Before `PATCH`, apply `trim()` and convert an empty string to `null`.
   Clearing the form content then removes the persisted value.
5. After success, invalidate both `getProjectQueryKey(projectId)` and
   `projectsKeys.lists()`. Reload the detail because the update response
   does not contain technology, command, and resource collections.

The path is only a user-supplied reference; the API must not
assume the server can access the browser filesystem or verify
whether the directory exists.

## Step 19 — archive a project

Archiving is not a normal edit. Its dedicated endpoint is:

```text
PATCH /api/project/:id/archive
```

Implement this action separately:

1. Create `archiveProject(projectId)` in `features/projects/api/` without a body;
2. Create `useArchiveProject` with `useMutation`;
3. On success, invalidate project details and lists and show a toast;
4. Add a confirmation button on the detail page;
5. Disable editing, technology, command, and resource actions while
   `archivedAt` existir;
6. Keep the project queryable and show an Archived badge;
7. Use `PATCH /api/project/:id/restore` to enable restoration in a
   mutation distinta.

The operation is idempotent: repeated archiving must not change the
date again. `ProjectStatus` must not change automatically either; it is
independent and preserves, for example, an archived `FINISHED` project.

### What falls outside general updates?

| Operation | Endpoint | Reason for separation |
| --- | --- | --- |
| Archive/restore | `PATCH /api/project/:id/archive` and `PATCH /api/project/:id/restore` | Lifecycle transition |
| Delete | `DELETE /api/project/:id` | Hard deletion and explicit confirmation |
| Technology | `POST`/`DELETE /api/project/:id/technologies/...` | Related entity |
| Command | `POST`/`PATCH`/`DELETE /api/project/:id/commands/...` | Related entity |
| Resource | `POST`/`PATCH`/`DELETE /api/project/:id/resources/...` | Related entity |

Before creating a function, find the corresponding use case in
`docs/usecases/projects.md`. It determines whether the action is
a general data update or an explicit domain operation.

## Topics to study while implementing

- Local state versus remote state;
- Query identity and `queryKey` composition;
- `useQuery` versus `useMutation`;
- Invalidation and manual cache updates;
- Client validation versus server validation;
- `FormProvider`, `Controller`, and form accessibility;
- React Router loaders as navigation boundaries;
- Pagination based on server metadata;
- Domain, transport, and presentation separation;
- UI states: pending, error, empty, success, and refetching.

If something is difficult, first implement without filters or pagination,
confirm the `GET → render` cycle, then add one responsibility at a
time. This file is a study guide, not a checklist to copy
all at once.

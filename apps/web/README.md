# DevLog Web

DevLog's React frontend for recording technical knowledge and organizing it by
project.

## MVP 1.0 status

The project and technical-journal workflows are complete in the web app.
Authenticated users can manage projects and their related data, record and
resolve technical issues, and find entries through the journal and tag filters.
Account settings, Activity Timeline, and Knowledge Overview are also implemented
in the current working tree.

The `/` route is a public product introduction. It explains DevLog before a
visitor creates an account or signs in, and it deliberately does not request
the authenticated session endpoint. The private workspace overview lives at
`/dashboard`.

### Projects

The `/projects` page supports paginated search, filtering, and project
creation. A project detail page brings together its overview, technologies,
technical entries, environments, commands, resources, and settings. Users can
create, edit, and remove project environments, commands, and resources, add and
remove technologies, and manage project metadata and lifecycle. Archived projects are read-only, and
permanent deletion is protected by confirmation.

The `/environments` page searches and filters the user's environment records
by name or runtime details, category, and project. Its filters and page are
kept in the URL. Environment details describe runtime conditions and do not
store credentials or deployment configuration.

### Technical journal

The journal provides paginated active and archived lists, filters for title,
type, issue status, and tag, plus entry details with Markdown rendering. Users
can create entries, edit title/context/conclusion, assign or remove tags, and
archive, restore, or permanently delete entries.

Links from Knowledge Overview can scope the active journal using `projectId`
in the URL. Search and pagination preserve that scope. **Show all projects**
removes the project scope and resets the page while preserving other filters;
**Clear** removes all filters.

For `ISSUE` entries, users can record, edit, and remove solution attempts,
resolve an issue with a conclusion, and reopen a resolved issue while keeping
its attempts and conclusion. A successful solution attempt can resolve an open
issue using the attempt description as its conclusion.

Quick Capture is available from the sidebar. It opens the regular technical
entry form, so captured items are complete entries rather than drafts.

### Account and settings

The `/account` page displays the signed-in user's name and email. `/settings`
provides separate forms to update the name and change the password. A name
update synchronizes the shared user cache; a successful password change clears
the password fields. Email remains read-only. See the
[account settings guide](../../docs/guides/account-settings.md).

### Insights

- `/activity-timeline` groups active entries by local creation day, newest first.
  Project/type filters live in the URL; **Load more** fetches another 20 entries.
  Status badges show each issue's current state. See the
  [Activity Timeline guide](../../docs/guides/activity-timeline.md).
- `/knowledge-overview` shows learning/open-issue/resolved-issue totals, the
  resolved share of issues, and the five most recent learnings and resolutions.
  One URL project filter applies to all blocks and journal exploration links.
  See the [Knowledge Overview guide](../../docs/guides/knowledge-overview.md).

Both screens reuse the technical-entry search API and exclude archived entries.
They describe the current journal; they do not provide an audit log or historical
analytics. Their project selectors include archived projects because these may
still have active entries.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Public DevLog introduction; no authentication required |
| `/dashboard` | Authenticated workspace overview with recent work |
| `/account` | Authenticated account details |
| `/settings` | Profile name and password forms |
| `/activity-timeline` | Active entries by local creation day with incremental loading |
| `/knowledge-overview` | Journal totals, issue composition, and recent knowledge |
| `/projects` | Paginated project list and creation |
| `/projects/:projectId` | Project overview and related data |
| `/technical-entries` | Paginated active journal, filters, and optional `projectId` URL scope |
| `/technical-entries/:technicalEntryId` | Technical entry details and actions |
| `/technical-entries/archived` | Paginated archived entries |
| `/tags` | Search and manage tags |
| `/technologies` | Search technologies recorded on projects |
| `/environments` | Search and filter environments recorded on projects |

Quick Capture is a sidebar action and does not have its own route.

The complete implementation status and post-MVP scope are in
[`../../docs/backlog/frontend.md`](../../docs/backlog/frontend.md).

## Technologies

- React 19 + TypeScript;
- Vite;
- React Router;
- TanStack Query;
- Axios;
- Tailwind CSS 4;
- shadcn/ui, Radix UI, and Lucide;
- React Hook Form + Zod;
- date-fns with the `en-US` locale.

## Code organization

```text
src/
  api/                 # HTTP client and API configuration
  app/providers/       # Global application providers
  components/          # Shared components and UI primitives
  features/            # Code organized by feature
    auth/              # Authentication, account settings, and session flows
    activity-timeline/ # Incremental journal queries and local-day grouping
    home/              # Workspace overview
    knowledge-overview/ # Journal totals, issue composition, and recent entries
    landing/           # Public product introduction
    projects/          # Project APIs, forms, lifecycle, and detail screens
    tags/              # Tag search, management, and selection controls
    technologies/      # Technology listing and project associations
    environments/      # Environment forms, project tab, and global search
    technical-entry/   # Journal lists, details, attempts, and lifecycle
  lib/                 # Query client, dates, and utilities
  routes/              # Browser route definitions
  main.tsx             # React entry point
  index.css            # Tailwind, theme, and visual tokens
```

Features with their own rules belong in `features/`. Reusable components belong
in `components/`; cross-cutting concerns such as dates and caching belong in
`lib/`.

## Local configuration

From the monorepo root:

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
```

`VITE_API_URL` defines the base URL used by `src/api/http.ts`:

```env
VITE_API_URL=http://localhost:3000/api
```

If the variable is absent, the same address is used as a fallback. The API must
be running and allow the Vite origin in `CORS_ALLOWED_ORIGINS`.

## Running

```bash
# Start Vite with hot module replacement
pnpm --filter web dev

# Validate types and create a production build
pnpm --filter web build

# Run lint checks
pnpm --filter web lint

# Run frontend unit/component tests
pnpm --filter web test

# Run browser end-to-end tests
pnpm --filter web test:e2e

# Preview the generated build locally
pnpm --filter web preview
```

Vite usually serves the app at `http://localhost:5173`.

## Foundation decisions

### API communication

Use the `api` instance from `src/api/http.ts` for new calls. It sets
`withCredentials: true`, required because the backend stores the JWT in a
protected cookie. Isolated Axios instances may break authentication or produce
inconsistent URLs.

### Remote data

`queryClient` treats data as fresh for 30 seconds, does not refetch on window
focus, and avoids retries for HTTP `4xx` errors. This policy distinguishes
validation or authorization errors from temporary server failures.

### Forms and UI

`useLoginForm` is the form reference: Zod describes the data, and React Hook Form
controls state and validation. Use the tokens and components in `src/index.css`
and `src/components/ui`, composing styles with Tailwind classes.

All interface text, accessibility labels, validation messages, and
notifications must be in English. Dates and numbers use `en-US`.

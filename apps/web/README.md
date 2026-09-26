# DevLog Web

DevLog's React frontend for recording technical knowledge and organizing it by
project.

## MVP 1.0 status

The project and technical-journal workflows are complete in the web app.
Authenticated users can manage projects and their related data, record and
resolve technical issues, and find entries through the journal and tag filters.

The `/` route is a public product introduction. It explains DevLog before a
visitor creates an account or signs in, and it deliberately does not request
the authenticated session endpoint. The private workspace overview lives at
`/dashboard`.

### Projects

The `/projects` page supports paginated search, filtering, and project
creation. A project detail page brings together its overview, technologies,
technical entries, environments, commands, resources, and settings. Users can create, edit,
and remove project environments, commands, and resources, add and remove technologies, and
manage project metadata and lifecycle. Archived projects are read-only, and
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

For `ISSUE` entries, users can record, edit, and remove solution attempts,
resolve an issue with a conclusion, and reopen a resolved issue while keeping
its attempts and conclusion. A successful solution attempt can resolve an open
issue using the attempt description as its conclusion.

Quick Capture is available from the sidebar. It opens the regular technical
entry form, so captured items are complete entries rather than drafts.

### Account

The `/account` page currently displays the signed-in user's name and email.
The API supports changing a user's name and password, but the frontend flows to
manage those values are still planned. Email is read-only under the current API
contract.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Public DevLog introduction; no authentication required |
| `/dashboard` | Authenticated workspace overview with recent work |
| `/account` | Authenticated account details |
| `/projects` | Paginated project list and creation |
| `/projects/:projectId` | Project overview and related data |
| `/technical-entries` | Paginated active journal and filters |
| `/technical-entries/:technicalEntryId` | Technical entry details and actions |
| `/technical-entries/archived` | Paginated archived entries |
| `/tags` | Search and manage tags |
| `/technologies` | Search technologies recorded on projects |
| `/environments` | Search and filter environments recorded on projects |

Quick Capture is a sidebar action and does not have its own route.

## Planned after MVP 1.0

- Account data management: profile name and password flows.
- Activity Timeline: a chronological view of project and journal activity.
- Knowledge Overview: a summary of the technical knowledge recorded across
  projects and entries.

The complete status and follow-up roadmap are in
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
    auth/              # Authentication, account details, and session flows
    home/              # Workspace overview
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

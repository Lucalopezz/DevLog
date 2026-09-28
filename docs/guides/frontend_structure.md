# Frontend organization

## Main rule

The frontend is organized by **domain inside `features/`**. Each domain keeps artifacts that change together close to one another: API calls, types, hooks, components, and pages.

This prevents global `services/`, `types/`, or `components/` directories from becoming collections of unrelated code. Global code should have no knowledge of DevLog domains.

## Structure

```text
apps/web/src/
  api/                         # Shared HTTP infrastructure
    http.ts
  app/                         # Global application composition
    providers/
      app-providers.tsx
  assets/                      # Files imported by code
  components/                  # Reusable, domain-independent interface
    ui/
    markdown.tsx
  features/                    # Product domains and features
    auth/
      hooks/
        use-login-form.ts
      schemas/
        login.schema.ts
      types/
        auth.ts
    activity-timeline/
      hooks/use-activity-timeline.ts
      pages/activity-timeline-page.tsx
      group-entries-by-day.ts
    home/
      pages/
        home-page.tsx
    knowledge-overview/
      hooks/use-knowledge-overview.ts
      pages/knowledge-overview-page.tsx
    projects/
      hooks/use-project-options.ts
    technical-entry/
      api/list-technical-entries.ts
      hooks/use-technical-entries.ts
  lib/                         # Domain-independent utilities and configuration
    date.ts
    query-client.ts
    utils.ts
  routes/                      # Route definitions and guards
    router.tsx
  index.css                    # Global styles and theme tokens
  main.tsx                     # React entry point
```

Create global directories such as `hooks/`, `types/`, and `test/` only when shared code justifies them. Do not create empty directories for future needs.

## Feature structure

As a domain grows, its directory may take this shape:

```text
features/projects/
  api/                         # Requests, query keys, and domain mappings
    list-projects.ts
    create-project.ts
  hooks/                       # Project-specific hooks
    use-projects.ts
    use-create-project.ts
  pages/                       # Screens served by domain routes
    projects-page.tsx
    project-detail-page.tsx
  components/                  # UI that knows Project and belongs to this domain
    project-form.tsx
    project-card.tsx
  types.ts                     # Domain contracts and types
  presentation.ts              # Interface labels, colors, and formats
  index.ts                     # Optional, intentional public feature API
```

Subdirectories and files are optional. A small feature with one page does not need empty `api/`, `hooks/`, and `components/` directories.

Current DevLog features include `projects`, `tags`, `technologies`, `environments`,
and `technical-entry`, as well as authentication and composed views such as
`activity-timeline` and `knowledge-overview`. Actions such as creating,
archiving, or resolving an entry stay in their domain. Extract an action into
its own feature only when it becomes complex or is reused across distinct flows.

## Root directory responsibilities

| Directory | Should contain | Should not contain |
| --- | --- | --- |
| `api/` | Axios client, interceptors, generic response/pagination types. | `Project`, `Tag`, or `TechnicalEntry` requests. |
| `app/` | Providers, global configuration, application composition. | Domain pages or rules. |
| `assets/` | Images and fonts imported by TypeScript/CSS. | Directly served public files; use `public/`. |
| `components/` | Generic components, shadcn, domain-independent UI. | `ProjectCard`, `TagForm`, or feature-exclusive components. |
| `features/` | Product domain-specific code. | Global React Query, Axios, or theme configuration. |
| `lib/` | Pure utilities and reusable configuration, such as dates, `cn`, and Query Client. | Domain rules or types. |
| `routes/` | Route definitions, loaders/actions, and guards. | Extensive page implementation. |

## Dependencies and imports

The expected dependency flow is:

```text
api, lib, and components → features → routes and app
```

- `api/`, `lib/`, and `components/` must not import from a feature.
- A feature may import shared infrastructure and UI.
- `routes/` points to feature pages but does not contain their business rules.
- Avoid deep imports between features. If a cross-domain dependency is necessary, expose only the required contract through the supplying feature's `index.ts`.
- Prefer direct imports within a feature. `index.ts` is a deliberate public boundary, not a mandatory re-export file.

## API and remote state

`api/http.ts` is the single Axios configuration: base URL, cookies, and future global behaviors. Resource calls belong to the domain that knows them:

```text
features/projects/api/list-projects.ts
features/projects/hooks/use-projects.ts
```

The first file calls `api`; the second wraps the React Query query. Pages therefore do not need to know the URL, `queryKey`, caching, or response transformation.

### Composing journal views

Activity Timeline and Knowledge Overview have their own pages and presentation
logic, but reuse the request functions, types, and query keys owned by
`technical-entry`. A new way to display journal data does not require a new
backend entity or a duplicate API layer.

- `useActivityTimeline` calls `listTechnicalEntries` through `useInfiniteQuery`.
  The page flattens its responses before the pure `groupEntriesByDay` function
  deduplicates IDs and groups entries by local calendar day.
- `useKnowledgeOverview` composes five `useTechnicalEntries` queries. Count
  cards use server `meta.total`; recent lists use returned records. Issue
  composition is derived from successful open/resolved totals.
- `useProjectOptions` belongs to `projects` and is shared by Environments and
  both insight pages. It reads every project page, including archived projects,
  to supply complete selectors and timeline project names.

The current implementation uses direct imports of those supplying feature
modules. Their ownership stays explicit; moving them into `lib/` would make a
domain-independent directory depend on project and journal contracts.

URL parameters own the project/type filters; TanStack Query owns the server
responses and timeline page numbers. Both journal query shapes sit under
`technicalEntriesKeys.lists()`, with separate `list` and `infinite` segments.
This shares mutation invalidation without mixing a collection response with
the infinite query's `{ pages, pageParams }` shape.

See the [timeline diagrams](../diagrams/frontend/activity-timeline.md) and
[overview diagrams](../diagrams/frontend/knowledge-overview.md) for the flows,
failure handling, and pagination/snapshot trade-offs.

## Forms and presentation

Zod schemas, inferred types, and React Hook Form hooks stay in the form's feature. In `auth`, for example, `schemas/login.schema.ts`, `types/auth.ts`, and `hooks/use-login-form.ts` form a unit.

The [account settings guide](account-settings.md) follows this collaboration for
the profile and password forms: schemas validate form values, mutation hooks
coordinate server updates and notifications, and the shared current-user query
keeps profile consumers synchronized.

Use `presentation.ts` for display details that should not leak into the API: status text, badge colors, icons, and specific formats. For example, a `PAUSED` API value could be displayed as “Paused” by that map. Use English display text throughout.

## Tests

The frontend uses Vitest with Testing Library and MSW. `src/test/` holds shared
infrastructure only: setup, handlers, renderers, and factories. Behavior tests
stay near the feature they protect:

```text
features/projects/
  components/project-form.tsx
  components/project-form.spec.tsx
```

This proximity makes it easier to remove or change a feature without leaving orphaned tests in a global directory.

Browser tests live in `e2e/mocked/` and use Playwright. See the
[frontend testing guide](frontend-testing.md) for the responsibilities of each
test layer.

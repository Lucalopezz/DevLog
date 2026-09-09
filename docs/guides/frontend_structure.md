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
    home/
      pages/
        home-page.tsx
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

Expected DevLog domains include `projects`, `tags`, and `technical-entries`. Actions such as creating, archiving, or resolving an entry initially stay in their domain. Extract an action into its own feature only when it becomes complex or is reused across distinct flows.

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

## Forms and presentation

Zod schemas, inferred types, and React Hook Form hooks stay in the form's feature. In `auth`, for example, `schemas/login.schema.ts`, `types/auth.ts`, and `hooks/use-login-form.ts` form a unit.

Use `presentation.ts` for display details that should not leak into the API: status text, badge colors, icons, and specific formats. For example, a `PAUSED` API value could be displayed as “Paused” by that map. Use English display text throughout.

## Tests

When the frontend gains a test runner, `src/test/` should hold shared infrastructure only: setup, MSW handlers, renderers, and factories. Behavior tests should stay near the feature they protect:

```text
features/projects/
  components/project-form.tsx
  components/project-form.spec.tsx
```

This proximity makes it easier to remove or change a feature without leaving orphaned tests in a global directory.

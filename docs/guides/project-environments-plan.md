# Project environments — TDD implementation plan

Status: implemented. This document preserves the first-version scope and the
test checkpoints used to review the feature. Current behavior is described in
[project use cases](../usecases/projects.md#uc-44--create-project-environment).

## 1. Goal

Add project environments as documented execution or deployment contexts. An
environment answers **where and under which runtime conditions a project is
used**, while a technology answers **what the project is built with**.

Examples:

- `Local development` — Ubuntu 24.04, Node.js 22;
- `Testing` — Ubuntu, Node.js 22;
- `Production` — Ubuntu 24.04, Node.js 22.

The feature has two user interfaces:

1. A project-detail tab where the user creates, edits, and removes the
   environments belonging to that project.
2. A read-oriented `/environments` page where the user searches and filters
   environments across all owned projects.

The implementation must follow test-driven development (TDD). Every behavioral
slice starts with a failing test, adds only enough production code to pass, and
then improves the design while the suite remains green.

## 2. Scope boundaries

### Included in the first version

- An environment belongs to exactly one project.
- Create, list, update, and remove project environments.
- Search all of the authenticated user's environments.
- Filter the global list by category and project.
- Paginate and sort list responses.
- Enforce project ownership for every operation.
- Make environments read-only while their project is archived.
- Show loading, empty, error, refreshing, and mutation states in the UI.
- Preserve filters and pagination in the `/environments` URL.

### Explicitly excluded

- Storing `.env` variables, passwords, tokens, certificates, or provider
  credentials;
- Executing commands, deploying applications, or checking environment health;
- Automatically inspecting the local computer, containers, or cloud services;
- Synchronizing with Docker, Kubernetes, Vercel, AWS, or similar platforms;
- Modeling ports, services, machines, or arbitrary key-value configuration;
- Assigning a different subset of project technologies to each environment.

These exclusions keep DevLog a knowledge-recording application rather than a
secrets manager or deployment platform. They can be reconsidered through a
separate product and security decision if concrete use cases appear.

## 3. Terminology and domain decisions

### Environment versus technology

`Next.js`, `NestJS`, and `PostgreSQL` remain project technologies. `Ubuntu
24.04` and `Node.js 22` describe the conditions in which those technologies
run. Duplicating frameworks in both features would create two sources of truth.

### Environment category

The initial categories are:

```ts
type ProjectEnvironmentCategory =
  | 'LOCAL'
  | 'DEVELOPMENT'
  | 'TESTING'
  | 'STAGING'
  | 'PRODUCTION'
  | 'OTHER'
```

An enum enables predictable filters and presentation. `OTHER` keeps the model
open to unusual workflows without accepting inconsistent spellings for common
categories.

### Name uniqueness

Environment names are unique per project after trimming and case
normalization. `Local Development` and `local development` therefore conflict
inside one project, but another project may use either name.

The display name preserves the user's capitalization. A separate
`normalizedName` field provides a database-enforced uniqueness constraint and
prevents concurrent requests from creating duplicates.

### Project lifecycle

Archiving a project does not delete or separately archive its environments.
They remain visible but cannot be created, edited, or removed until the project
is restored. Permanently deleting a project deletes its environments through a
cascade, consistent with project technologies, commands, and resources.

## 4. Proposed data model

The intended Prisma shape is:

```prisma
model ProjectEnvironment {
  id              String                     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  projectId       String                     @map("project_id") @db.Uuid
  name            String                     @db.VarChar(100)
  normalizedName  String                     @map("normalized_name") @db.VarChar(100)
  category        ProjectEnvironmentCategory
  operatingSystem String?                    @map("operating_system") @db.VarChar(100)
  runtime         String?                    @db.VarChar(100)
  runtimeVersion  String?                    @map("runtime_version") @db.VarChar(50)
  description     String?
  createdAt       DateTime                   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime                   @updatedAt @map("updated_at") @db.Timestamptz(6)
  project         Project                    @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, normalizedName], map: "project_environments_project_id_normalized_name_key")
  @@index([projectId], map: "idx_project_environments_project")
  @@index([category], map: "idx_project_environments_category")
  @@map("project_environments")
}
```

`Project` receives an `environments ProjectEnvironment[]` relation. The
category enum uses the values defined above and maps to a PostgreSQL enum.

### Validation rules

| Field | Rule |
| --- | --- |
| `name` | Required string, trimmed, 2–100 characters |
| `category` | Required supported enum value |
| `operatingSystem` | Optional trimmed string, maximum 100 characters |
| `runtime` | Optional trimmed string, maximum 100 characters |
| `runtimeVersion` | Optional trimmed string, maximum 50 characters |
| `description` | Optional trimmed string, maximum 1,000 characters |

For updates, omission preserves an optional field and `null` clears it. At
least one editable field must be supplied.

## 5. API contract

All endpoints require authentication.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/project/environments` | Search environments across owned projects |
| `GET` | `/api/project/:projectId/environments` | List one owned project's environments |
| `POST` | `/api/project/:projectId/environments` | Create an environment |
| `PATCH` | `/api/project/:projectId/environments/:environmentId` | Partially update an environment |
| `DELETE` | `/api/project/:projectId/environments/:environmentId` | Remove an environment |

The static `/project/environments` route should be declared before dynamic
project routes so that `environments` is never interpreted as a project ID.

### Create request

```json
{
  "name": "Local development",
  "category": "LOCAL",
  "operatingSystem": "Ubuntu 24.04",
  "runtime": "Node.js",
  "runtimeVersion": "22",
  "description": "PostgreSQL runs through Docker Compose."
}
```

### Item response

```json
{
  "id": "7f429a53-a43c-44a2-8227-d6b69a076203",
  "projectId": "91a5bd6b-8fa4-4406-a631-31a4c0d02c6d",
  "projectName": "DevLog",
  "name": "Local development",
  "category": "LOCAL",
  "operatingSystem": "Ubuntu 24.04",
  "runtime": "Node.js",
  "runtimeVersion": "22",
  "description": "PostgreSQL runs through Docker Compose.",
  "createdAt": "2026-09-25T18:00:00.000Z",
  "updatedAt": "2026-09-25T18:00:00.000Z"
}
```

`projectName` is included in list responses so the global page does not need
one project request per environment. The backend remains responsible for
restricting the result to projects owned by the authenticated user.

### Search parameters

The global endpoint accepts:

- `search`: case-insensitive match against environment name, operating system,
  or runtime;
- `category`: exact enum filter;
- `projectId`: exact owned-project filter;
- `page`, `perPage`, `sort`, and `sortDir`: existing pagination conventions.

The per-project list accepts pagination and sorting. A missing project, another
user's project, or an environment outside the supplied project is reported as
resource not found, following the existing ownership policy.

## 6. Architecture and data flow

The feature follows the existing project feature boundaries:

```text
React form or filters
  -> Zod schema
  -> TanStack Query hook
  -> API request function
  -> Nest controller and DTO
  -> application use case
  -> domain entity and repository contract
  -> Prisma repository and PostgreSQL
  -> presenter response
  -> query cache invalidation/refetch
  -> visible UI state
```

Suggested backend locations:

```text
apps/api/src/project/
  application/dto/environment/
  application/usecases/environment/
  domain/entities/environment/
  domain/repositories/environment/
  domain/validators/environment/
  infrastructure/database/prisma/repositories/environment/
  infrastructure/dto/environment/
  infrastructure/presenter/environment/
```

Suggested frontend locations:

```text
apps/web/src/features/environments/
  api/
  components/
  hooks/
  pages/
  schemas/
  types/
```

Environment mutations belong to the project-detail tab. The global page is a
search and navigation view; each project group links back to its project.

## 7. TDD working agreement

Each numbered slice below is completed independently:

1. **Red:** write one small test describing behavior through a public
   interface. Run it and confirm that it fails for the expected reason.
2. **Green:** add the smallest implementation that makes that test pass. Do not
   add speculative fields or abstractions.
3. **Refactor:** remove duplication and improve naming or structure while all
   relevant tests remain green.
4. Commit or record the completed behavior before starting the next red test.

A test that passes before production code changes is not a valid red phase. A
failure caused only by a syntax error, broken fixture, or missing test setup is
also not the desired red phase; the failure must demonstrate missing behavior.

Prefer observable outcomes over private implementation details:

- Domain tests observe valid state and validation errors.
- Use-case tests observe results, exceptions, and repository effects.
- Repository integration tests observe persisted and queried records.
- Frontend tests interact through labels, roles, buttons, and visible messages.
- Browser tests exercise navigation, URL state, focus, and responsive behavior.

## 8. Backend implementation slices

### Slice B1 — Domain entity and normalization

**Red tests**

- Creates a valid environment and exposes trimmed values.
- Normalizes the name for uniqueness without changing its display form.
- Rejects an empty, too-short, or too-long name.
- Rejects an unsupported category.
- Rejects optional values over their maximum lengths.
- Updates `updatedAt` only when the entity changes.

**Green implementation**

- Add the category enum, entity, properties, factory/update methods, and
  class-validator-based validator following the existing domain pattern.

**Refactor checkpoint**

- Keep normalization in one named function or value object so use cases and
  persistence cannot apply different rules.

### Slice B2 — Create use case

**Red tests**

- Creates an environment for an owned, active project.
- Reports a missing or foreign project as not found.
- Rejects creation for an archived project.
- Rejects a duplicate normalized name with a conflict error.
- Persists the environment exactly once.

**Green implementation**

- Add the repository contract and `AddProjectEnvironmentUseCase`.
- Use mocked repository contracts in these unit tests; do not introduce Prisma
  merely to make use-case tests pass.

### Slice B3 — Persistence and migration

**Red tests**

- Round-trips every field through the model mapper.
- Inserts and finds an environment in PostgreSQL.
- Enforces normalized-name uniqueness per project.
- Allows the same normalized name in different projects.
- Cascades environments when their project is deleted.

**Green implementation**

- Add the Prisma model, enum, and migration.
- Add the mapper and Prisma repository operations required by the tests.

The integration test should be written before the Prisma implementation. It is
expected to fail until the schema, generated client, and repository exist.

### Slice B4 — Project and global searches

**Red tests**

- Lists only environments belonging to the authenticated user's projects.
- Lists only environments from the requested owned project.
- Applies search, category, and project filters.
- Returns stable pagination and sorting metadata.
- Includes `projectName` without issuing a query per returned item.
- Returns an empty page when no records match.

**Green implementation**

- Add repository search input/output contracts and search use cases.
- Implement the Prisma query and collection presenter.

### Slice B5 — Update use case

**Red tests**

- Changes supplied fields and preserves omitted fields.
- Clears optional fields supplied as `null`.
- Rejects an empty update.
- Rejects duplicates after normalization.
- Rejects an environment outside the requested project.
- Rejects updates to an archived project.

**Green implementation**

- Add `UpdateProjectEnvironmentUseCase` and the minimum repository update
  operation.

### Slice B6 — Remove use case

**Red tests**

- Removes an environment belonging to the requested owned project.
- Rejects a missing, foreign, or mismatched environment.
- Rejects removal from an archived project.

**Green implementation**

- Add `RemoveProjectEnvironmentUseCase` and repository delete support.

### Slice B7 — HTTP boundary

**Red tests**

- DTO tests reject extra fields, invalid enum values, oversized values, and
  empty update bodies.
- Controller or HTTP tests map the authenticated user ID into every use case.
- Responses use the documented camel-case contract and pagination metadata.
- Unauthenticated requests are rejected.
- The static global route does not conflict with `:projectId`.

**Green implementation**

- Add infrastructure DTOs, presenters, controller methods, and module
  providers.

### Backend validation after every slice

Run the smallest relevant command first, followed by broader checks at the end:

```bash
pnpm --filter api test -- --runInBand <relevant-spec>
pnpm --filter api test
pnpm --filter api test:integration
pnpm --filter api test:e2e
pnpm --filter api lint
pnpm --filter api build
```

Database integration tests require the dedicated test database described in
the API testing guide. Do not use `pnpm db:reset` to prepare it.

## 9. Frontend implementation slices

### Slice F1 — Types, presentation helpers, and schema

**Red tests**

- The Zod schema trims inputs and accepts a valid environment.
- It reports accessible field-level messages for invalid name, category, and
  length constraints.
- Empty optional inputs map to `undefined` on create and `null` when explicitly
  cleared during editing.
- Presentation helpers format category labels and runtime summaries.

**Green implementation**

- Add environment types, schema, and pure presentation helpers.

### Slice F2 — API functions and query keys

**Red tests**

- List functions serialize only supplied search parameters.
- Create, update, and delete functions use the documented URLs and payloads.
- Query keys distinguish global filters and individual project lists.
- A successful mutation invalidates both the affected project list and global
  environment lists.
- A failed mutation preserves form input and exposes a readable error.

**Green implementation**

- Add request functions and TanStack Query hooks.

Cache invalidation is important because the same record appears in two views.
Updating only one cache would leave the other page stale.

### Slice F3 — Project environment form

**Red component tests**

- Submitting an empty form shows validation and sends no request.
- A valid submission maps every field correctly.
- The submit button is disabled and communicates progress while pending.
- API failure keeps the dialog and user input available for retry.
- Editing pre-populates current values and can clear optional fields.
- Success closes the dialog and shows refreshed data.

**Green implementation**

- Build the form with React Hook Form, the Zod resolver, and existing shadcn/ui
  primitives. If a new shadcn/ui primitive is required, add it with the shadcn
  CLI rather than creating its library file manually.

### Slice F4 — Project-detail tab

**Red page tests**

- Displays environment cards after loading.
- Represents initial loading, empty, error, and background-refresh states.
- Opens create and edit forms through clearly named controls.
- Requires confirmation before deletion.
- Disables every mutation control for an archived project while retaining
  readable environment data.
- Supports keyboard navigation for the new tab using the existing tab pattern.

**Green implementation**

- Add the `environments` project-detail tab, section, dialogs, and query.

### Slice F5 — Global environments page

**Red page tests**

- Loads `/environments` with default pagination.
- Groups returned environments by project and links each group to its project.
- Writes search, category, project, and page filters to the URL.
- Reconstructs filters from a direct URL or browser navigation.
- Resets the page to one when a filter changes.
- Displays loading, empty-search, empty-account, error, retry, and refreshing
  states.
- Uses `en-US` formatting for result counts.

**Green implementation**

- Add `EnvironmentsPage`, its filter UI, cards, and pagination.
- Add the protected `/environments` route.
- Change the sidebar item from `planned` to a route only after the page and its
  route test exist.

The page should follow the established Technologies page conventions, but its
tests should describe environment behavior instead of copying component
internals.

### Slice F6 — Browser confidence

Add a small Playwright journey after component coverage is green:

1. Open `/environments` directly while authenticated.
2. Search and filter; verify the URL and visible project groups.
3. Follow `Open project` and activate the Environments tab with the keyboard.
4. Create an environment and observe it in the project list.
5. Return to the global page and observe the new item.
6. Check the page at a narrow viewport and confirm that controls remain usable.

The existing mocked browser suite may cover the frontend journey first. A
later full-stack test should cover one authenticated create-and-list path
against Nest and the test database; it verifies the HTTP seam without
duplicating every lower-level scenario.

### Frontend validation after every slice

```bash
pnpm --filter web test -- <relevant-spec>
pnpm --filter web test
pnpm --filter web lint
pnpm --filter web build
pnpm --filter web test:e2e
```

## 10. Acceptance criteria

The feature is complete only when all of the following are true:

- An authenticated user can create, view, edit, and remove environments inside
  an owned, unarchived project.
- The same normalized name cannot be used twice in one project.
- A user cannot infer, view, or mutate another user's environment records.
- An environment cannot be addressed through a project to which it does not
  belong.
- Archived projects expose environments as read-only.
- `/environments` lists only the current user's records and supports the
  documented filters, URL state, sorting, and pagination.
- Project and global views remain consistent after every mutation.
- No environment field accepts or encourages secrets.
- Backend unit, integration, and relevant HTTP tests pass.
- Frontend schema, component/page, routing, and relevant browser tests pass.
- API and web lint/build commands pass.
- README, use cases, diagrams, and backlogs describe the implemented behavior
  rather than the earlier plan.

## 11. Suggested implementation order and review boundaries

Keep reviews small and behavior-focused:

1. Domain model and unit tests;
2. Create use case and repository contract;
3. Prisma migration, mapper, repository, and integration tests;
4. Search, update, and remove use cases;
5. DTOs, presenters, endpoints, and HTTP tests;
6. Frontend types, schema, API functions, hooks, and tests;
7. Project-detail tab and component tests;
8. Global page, route, sidebar, and page tests;
9. Browser journey and documentation synchronization.

Do not create all production layers first and add tests afterward. The order
above describes review boundaries; within every boundary, continue using the
Red–Green–Refactor loop.

## 12. Topics worth studying during implementation

- Aggregate ownership: why child resources verify access through `Project`;
- Domain invariants versus transport validation;
- Database uniqueness as protection against concurrent requests;
- Mapper boundaries between Prisma records and domain entities;
- Outside-in versus inside-out TDD and why this plan uses small inside-out
  backend slices followed by user-observable frontend slices;
- TanStack Query cache keys and invalidation across multiple views;
- URL state as shareable and browser-compatible application state;
- Accessible tabs, dialogs, form errors, destructive confirmations, and
  asynchronous status announcements.

## 13. Related documentation

- [Project use cases](../usecases/projects.md) for the existing ownership and
  lifecycle rules this feature extends;
- [API testing strategy](testing.md) for unit and PostgreSQL integration-test
  organization;
- [Frontend testing guide](frontend-testing.md) for component integration,
  MSW, and browser-test boundaries;
- [Frontend roadmap](../backlog/frontend.md) for the original environments
  backlog item.

# Frontend testing implementation plan

Status: **Parts 0–2 implemented; Parts 3–9 remain proposed**. Source baseline:
commit `e608071`, inspected on 2026-09-14; completion review against `15df521`
on 2026-09-15 (the intervening commit adds the draft testing documents).
Recheck the named source files before implementing each part if the app changes.

Read [Frontend testing: a guide for backend developers](frontend-testing.md)
first. It explains the vocabulary, layers, tools, and reasoning behind this
plan. This document provides the implementation sequence, examples, and a
coverage inventory for the **whole current frontend**.

All commands below run from the repository root unless explicitly stated.
Paths beginning with `src/` in code-block captions are relative to `apps/web/`.
Code blocks are proposed implementations, not claims that those files exist or
have been executed. Complete examples depend on the earlier setup steps;
blocks explicitly labeled “sketch” need adaptation during implementation.

## Contents

- [Scope and current-state inventory](#scope-and-current-state-inventory)
- [Delivery sequence](#delivery-sequence)
- [Part 0 — Baseline and conventions](#part-0--baseline-and-conventions)
- [Part 1 — Runner and reusable test infrastructure](#part-1--runner-and-reusable-test-infrastructure)
- [Part 2 — Schemas, utilities, and request contracts](#part-2--schemas-utilities-and-request-contracts)
- [Part 3 — Authentication and routing](#part-3--authentication-and-routing)
- [Part 4 — Project lists and creation](#part-4--project-lists-and-creation)
- [Part 5 — Project details, editing, and lifecycle](#part-5--project-details-editing-and-lifecycle)
- [Part 6 — Technical journal](#part-6--technical-journal)
- [Part 7 — Tags and the standalone selector](#part-7--tags-and-the-standalone-selector)
- [Part 8 — Shared UI, accessibility, and browser behavior](#part-8--shared-ui-accessibility-and-browser-behavior)
- [Part 9 — Full-stack journeys, CI, and completion](#part-9--full-stack-journeys-ci-and-completion)
- [Cache synchronization matrix](#cache-synchronization-matrix)
- [Debugging and maintenance](#debugging-and-maintenance)

## Scope and current-state inventory

The source code is the baseline. Some existing documentation is behind the
implementation: `/tags` and the standalone `TagSelector` already exist, while
assigning tags from the entry form does not.

| Surface | Current source | Coverage destination |
| --- | --- | --- |
| `/login`, `/register` | Auth pages, `login-form`, auth schemas/hooks/API functions | Parts 2–3; real session journey in Part 9 |
| `/account` | `account-page.tsx`, `use-get-user.ts` | Part 3 |
| Route access | `routes/router.tsx`, `require-user.ts` | Part 3; refresh/deep links in Parts 8–9 |
| `/` | `home-page.tsx`, infrastructure demo and notification button | Part 8, one small smoke test |
| App shell | `root-layout.tsx`, `app-sidebar.tsx`, `app-providers.tsx`, `main.tsx` | Parts 3 and 8–9 |
| `/projects` | List, filters, pagination, create dialog | Part 4 |
| `/projects/:projectId` | Overview, entries, commands, resources, settings, edits and lifecycle | Part 5; linked entries in Part 6 |
| `/technical-entries` | Active list, title/type/status filters, create dialog | Part 6 |
| `/technical-entries/archived` | Separate archive page and filter scope | Part 6 |
| `/technical-entries/:technicalEntryId` | Detail, title/context/conclusion edits, lifecycle, displayed tags | Part 6 |
| `/tags` | Name filter, list, pagination, create and confirmed delete | Part 7 |
| Standalone tag picker | `features/tags/components/tag-selector.tsx`; currently no production consumer | Part 7 using a controlled parent harness |
| Shared behavior | `api/http.ts`, `lib/*`, `hooks/use-mobile.ts`, Markdown, SearchForm, FormInput | Parts 2 and 8 |
| Third-party UI and styling | `components/ui/*`, CSS, assets | Indirect feature tests and selected browser checks |

### Outside the current product scope

Do not write passing tests pretending these features are implemented: Quick
Capture, entry project/tag filters, persistent tag assignment, solution-attempt
editing, resolve/reopen actions, project technology/command/resource editing,
or the general Settings and Help pages. Test existing read-only content and
existing disabled placeholders. Add behavior tests when each future feature is
implemented.

### Findings to investigate with regression tests

These are source observations and proposed investigations, not reproduced
browser failures. Keep fixes as explicit implementation work in the relevant
part:

| Finding | Evidence and consequence | Planned action |
| --- | --- | --- |
| Incomplete archived-project protection | Settings disables edit/delete, but `ProjectInlineContent` renders its Edit button without checking `archivedAt` | Part 5: verify the read-only rule and add a regression/fix for inline editing |
| Archived entry edit affordances | Entry title and inline editors do not gate editing on `archivedAt` | Part 6: compare the documented API lifecycle rules, then test/fix the intended behavior |
| Some entry mutations omit the project list branch | Create/archive/restore invalidate linked project entries; update/delete currently do not | Part 6: demonstrate stale project cards and totals, then add missing invalidation |
| Tag deletion omits project detail collections | Tag lists, global entry lists, and entry details refresh, but project entry cards can retain old badges | Part 7: cover and repair cross-feature synchronization |
| Project deletion leaves cached entry associations | Prisma preserves linked entries with `projectId` set to null; the web mutation only removes the project branch and refreshes project lists | Parts 5–6: verify preserved entries lose the old project association in cached lists/details |
| Logout removes only the current-user query | Project/tag/entry data can remain in the cache during account switching | Part 3: test two users on identical query keys; define cancellation and clearing of user-scoped data |
| Project tabs use custom buttons | Click behavior exists; arrow-key tab navigation is not implemented | Part 8: test keyboard expectations and implement the chosen accessible tab pattern |
| Detail error screens conflate failures | Project/entry detail pages render “not found” content for any query error | Parts 5–6: characterize 404; track a separate improvement for network/500 messaging |
| Pagination after deleting the final row | List page numbers are URL state; mutations do not explicitly select an earlier page | Parts 5–7: test the outcome and define a recovery behavior if the user is stranded |

Do not add permanent skipped/failing tests to the default suite as a substitute
for completing a part. Keep an issue/checklist item when a fix must be deferred,
and state that the associated acceptance criterion remains incomplete.

## Delivery sequence

Each part can be split into the small commits listed in its section. Merge a
working increment before starting the next feature. Completion is based on
scenarios and validation, not an estimated number of tests.

| Part | Deliverable | Depends on | Suggested commit subject |
| --- | --- | --- | --- |
| 0 | Baseline and agreed conventions | Nothing | `docs(web): record frontend testing baseline` |
| 1 | Vitest, MSW, render helpers, first passing test | 0 | `test(web): add frontend test infrastructure` |
| 2 | Pure logic and meaningful HTTP contracts | 1 | `test(web): cover schemas and request contracts` |
| 3 | Session, access guards, login/register/account | 1–2 | `test(web): cover authentication and routing` |
| 4 | Project list, URL state, creation | 1–3 | `test(web): cover project search and creation` |
| 5 | Project details and lifecycle | 4 | `test(web): cover project details and lifecycle` |
| 6 | Active/archived journal and linked entry behavior | 4–5 | `test(web): cover technical journal workflows` |
| 7 | Tags and standalone controlled picker | 1–3, 6 for cross-feature cases | `test(web): cover tags and selection` |
| 8 | Shared UI, browser interactions, accessibility | 3–7 | `test(web): add browser interaction coverage` |
| 9 | Real-stack smoke journeys, CI, coverage review | 1–8 | `ci(web): enforce frontend quality checks` |

A basic lint/build/Vitest CI job can start as soon as Part 1 is complete; Part 9
finalizes browser and database orchestration. There is no need to postpone all
CI until every feature has tests.

## Part 0 — Baseline and conventions

### Work items

- [x] Run `pnpm --filter web lint` and `pnpm --filter web build`; record failures
  that predate the testing work.
- [x] Confirm Node and package versions before selecting test dependencies.
  `AGENTS.md` requests pnpm 11.18.0, while root `package.json` currently declares
  11.21.0. Reconcile this explicitly before installation/CI; do not silently
  change the lockfile with a different package manager.
- [x] Inspect the current runtime/package compatibility requirements in the
  official [Vitest installation guide](https://vitest.dev/guide/). Commit
  resolved compatible versions; keep Vitest and `@vitest/coverage-v8` aligned.
- [x] Record which current behaviors are deliberate and which findings above
  require a regression fix.
- [x] Adopt `*.spec.ts` for pure tests, `*.spec.tsx` for React tests, and
  `e2e/**/*.spec.ts` for Playwright. Keep feature tests beside their source.
- [x] Reserve `src/test/` for shared infrastructure, factories, and HTTP handlers.

### Planned structure

```text
apps/web/
  vitest.config.ts
  playwright.config.ts                 # Part 8
  playwright.full-stack.config.ts      # Part 9
  tsconfig.e2e.json                     # Part 8
  src/test/
    setup.ts
    query-client.ts
    render-with-providers.tsx
    render-app.tsx                      # Part 3
    deferred.ts
    mocks/
      server.ts
      urls.ts
      handlers/                        # Add per feature as needed
    factories/
      user.ts
      project.ts
      technical-entry.ts
      tag.ts
    browser/                           # Part 8, only required doubles
  src/features/projects/pages/
    projects-page.tsx
    projects-page.spec.tsx
  e2e/
    mocked/                            # Real browser, intercepted API
    full-stack/                        # Real Nest and test database
    fixtures/
```

**Exit criterion:** the baseline is recorded, commands are understood, and each
planned suite has a clear owner/layer. No dependency or test file is needed to
complete this documentation-only part.

The completed baseline and convention decisions are recorded in
[Frontend testing baseline](frontend-testing-baseline.md).

## Part 1 — Runner and reusable test infrastructure

Implementation status: **complete**.

### 1A. Install the initial stack

After selecting compatible releases in Part 0:

```bash
pnpm --filter web add -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom msw
```

Do not install Jest in the web package. The API keeps its existing Jest setup.
Do not install Playwright until Part 8. The [Testing Library installation
instructions](https://testing-library.com/docs/react-testing-library/intro/)
include `@testing-library/dom` as a peer dependency.

Add to `apps/web/package.json` while retaining existing scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:cov": "vitest run --coverage"
}
```

`test` must finish rather than enter watch mode, because `pnpm test` runs through
Turborepo. Watch is a separate developer command.

Proposed `apps/web/vitest.config.ts`:

```ts
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.spec.{ts,tsx}'],
    clearMocks: true,
    restoreMocks: true,
    env: {
      VITE_API_URL: 'http://localhost:3000/api',
      TZ: 'UTC',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/**/types/**',
        'src/api/types.ts',
        'src/assets/**',
        'src/components/ui/**',
        'src/main.tsx',
      ],
    },
  },
}))
```

The separate config merges the existing React/Tailwind plugins and alias rather
than duplicating them. Include production files in coverage so untouched code
appears in the report. Coverage exclusions are a reporting choice, not an
instruction to ignore behavior: `FormInput` and the UI compositions still need
feature-level accessibility coverage. `main.tsx` is exercised by browser smoke
tests. Keep the rationale beside exclusions if it changes. See
[Vitest coverage](https://vitest.dev/guide/coverage.html).

Configuration follow-through:

- Add `vitest.config.ts` to `tsconfig.node.json`'s `include` so the build checks
  the config. Leave `src/**/*.spec.*` and `src/test` under the app TypeScript
  project initially; `tsc -b` will check the proposed tests as well.
- Import `describe`, `it`, `expect`, and `vi` explicitly. No Jest globals or
  `@types/jest` in the web app.
- Import jest-dom's Vitest adapter in the TypeScript setup file below. Keep
  that file included by the app tsconfig for matcher type augmentation.
- Add an ESLint override disabling only
  `react-refresh/only-export-components` for `src/test/**/*.{ts,tsx}` and test
  files. These modules export render helpers; they are not hot-reload entry
  points. Preserve React Hooks rules.
- Give Node config files Node globals in ESLint. In Part 8, do the same for
  `e2e/**` and Playwright config.
- Ignore `coverage/` and `.vitest/` in `apps/web/.gitignore`. Add browser report
  and authentication-state paths in Part 8.
- Keep `src/test` imported exclusively by tests, never by `main.tsx` or features.

### 1B. Intercept HTTP and make cleanup explicit

`src/test/mocks/urls.ts`:

```ts
export const testApiUrl = 'http://localhost:3000/api'
export const apiUrl = (path: string) => `${testApiUrl}${path}`
```

`src/test/mocks/server.ts`:

```ts
import { setupServer } from 'msw/node'

// Start without success defaults: every test declares the API it needs.
export const server = setupServer()
```

`src/test/query-client.ts`:

```ts
import { QueryClient } from '@tanstack/react-query'

const clients = new Set<QueryClient>()

export function createTestQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  })
  clients.add(client)
  return client
}

export async function disposeTestQueryClients() {
  for (const client of clients) {
    await client.cancelQueries()
    client.clear()
  }
  clients.clear()
}
```

`gcTime: Infinity` avoids a scheduled garbage-collection timer in short tests;
explicit disposal prevents data from leaking. This is a test policy, not a
change to production caching. Tests must finish/release pending mutations;
clearing a query cache does not cancel arbitrary mutation promises.

`src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { server } from './mocks/server'
import { disposeTestQueryClients } from './query-client'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(async () => {
  // Unmount first so active observers cannot start another refetch.
  cleanup()
  await disposeTestQueryClients()
  server.resetHandlers()
  localStorage.clear()
  sessionStorage.clear()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

afterAll(() => server.close())
```

In Part 3 add router disposal between `cleanup()` and query disposal. In Part 8
reset media-query doubles and the sidebar cookie as well. If a test creates a
spy outside a test body, move it into the test: automatic restoration and
module-level spies do not mix well.

With `onUnhandledRequest: 'error'`, an undeclared request is a setup failure.
Verify that the suite actually fails: Axios/Query may catch the interception
error and render an expected error screen. If that hides the failure, collect
unexpected requests in the handler policy and assert the collection is empty
in teardown, while retaining MSW's error behavior. Do not rely only on stderr.
Do not change this to blanket bypass when a page mounts more queries than
expected. For example, ProjectDetailPage starts all its collection queries
before a tab is clicked, so its tests need all four GET handlers.

MSW in Node uses `setupServer`; it does not require generating a service worker
or adding an MSW worker to the production app.

### 1C. Render a component with fresh dependencies

`src/test/render-with-providers.tsx`:

```tsx
import type { ReactElement } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createTestQueryClient } from './query-client'

export function renderWithProviders(
  ui: ReactElement,
  { route = '/' }: { route?: string } = {},
) {
  const client = createTestQueryClient()
  const user = userEvent.setup()

  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={client}>
        <TooltipProvider>
          {ui}
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )

  return { ...result, user, client }
}
```

This helper supports components and explicit `<Routes>` trees. It does **not**
run the app's loaders. Use the Part 3 data-router helper for access control and
complete navigation tests. Do not put both routers around the same component.

The helper intentionally avoids `AppProviders` for now because it uses the
production singleton and loads development tools. Part 3 makes its client
injectable and gives the application renderer a way to disable Devtools.

Add a complete initial test at `src/lib/get-api-error-message.spec.ts`:

```ts
import { expect, it } from 'vitest'
import { getApiErrorMessage } from './get-api-error-message'

it('uses the fallback when the failure is not an Axios error', () => {
  expect(getApiErrorMessage(new Error('offline'), 'Please try again.'))
    .toBe('Please try again.')
})
```

### Acceptance and validation

- [x] A pure test and the empty-login example in the learning guide pass.
- [x] A missing HTTP handler fails visibly instead of contacting the real API.
- [x] Two tests with different responses do not share cache or DOM state.
- [x] Tests are type-checked; lint accepts test helpers without disabling hooks rules.
- [x] `pnpm --filter web test`, `pnpm --filter web test:cov`,
  `pnpm --filter web lint`, and `pnpm --filter web build` pass.
- [x] `pnpm test` discovers the web task and exits. It may also run API tests;
  distinguish unrelated baseline failures from web failures.

## Part 2 — Schemas, utilities, and request contracts

Implementation status: **complete**.

**Goal:** learn familiar input/output testing before adding more UI complexity.
Split into pure validation tests, shared utilities, and request contracts.

### Schema and utility scenario inventory

| Proposed suite beside source | Required cases |
| --- | --- |
| `auth/schemas/login.schema.spec.ts` | Invalid/valid email; empty/nonempty password; no invented six-character login rule |
| `auth/schemas/register.schema.spec.ts` | Name length 2/3; password 5/6; missing confirmation; mismatch attached to `confirmPassword`; valid complete input |
| `projects/schemas/project.schema.spec.ts` | Create name 2/3/150/151; optional description; update trims name and accepts only ACTIVE/INACTIVE/FINISHED; description can be cleared |
| `technical-entry/schemas/technical-entry.schema.spec.ts` | Title 2/3/200/201 after trimming; context 2/3 after trimming; ISSUE/LEARNING; empty conclusion; project ID empty/UUID/invalid and optional/null variants in create schema; title-only update |
| `tags/schemas/tag.schema.spec.ts` | Name 2/3/80/81 after trimming; whitespace-only rejected |
| `projects/types/project.spec.ts` | `isProjectStatus` accepts real enum values; rejects lowercase, unknown, null/undefined |
| `technical-entry/types/technical-entry.spec.ts` | Type/status guards accept allowed values and reject unknown/null values |
| `lib/get-api-error-message.spec.ts` | Axios message string, whitespace-only fallback, message array joining, missing body/message, non-Axios fallback |
| `lib/date.spec.ts` | Date/string inputs, fixed en-US calendar output, past/future relative output under a frozen clock |
| `lib/utils.spec.ts` | One meaningful conditional/conflicting Tailwind class composition example for `cn`; do not retest the entire third-party library |
| Feature `presentation.spec.ts` | Labels exist for every supported enum/resource type; assert labels rather than full class strings or icon internals |

Current create-project and register schemas do not trim all fields. Do not
assert trimming because another schema does it. Record desired normalization
as a separate improvement. Likewise, do not invent invalid-date fallbacks:
`formatDate` currently delegates invalid input to date-fns.

Example `src/features/tags/schemas/tag.schema.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { tagSchema } from './tag.schema'

describe('tagSchema', () => {
  it.each([2, 81])('rejects a name with %i characters', (length) => {
    expect(tagSchema.safeParse({ name: 'a'.repeat(length) }).success)
      .toBe(false)
  })

  it.each([3, 80])('accepts a name with %i characters', (length) => {
    expect(tagSchema.safeParse({ name: 'a'.repeat(length) }).success)
      .toBe(true)
  })

  it('trims the value returned to the submit handler', () => {
    expect(tagSchema.parse({ name: '  React  ' })).toEqual({ name: 'React' })
  })
})
```

Freeze date tests locally using `vi.useFakeTimers()` and
`vi.setSystemTime(new Date('2026-09-14T12:00:00Z'))`; restore afterward. Use a
fixed timezone for the worker process if the selected runtime does not apply
`TZ` from test config early enough. Never make the expected value depend on
`new Date()` at assertion time.

### HTTP contract inventory

Test at the HTTP boundary only when it adds coverage not already established
by a feature integration test. The following contracts must be covered
somewhere; it is not a requirement for a separate suite per wrapper.

| API functions | Contract |
| --- | --- |
| Auth | `GET /users/me`, `POST /auth/login`, `POST /auth/logout`, `POST /users`; responses are unwrapped User objects |
| Projects | `/project` list/create; `GET/PATCH/DELETE /project/:id`; archive/restore via PATCH suffix |
| Project collections | GET `/project/:id/technical-entries`, `/commands`, `/resources`; defaults page 1/perPage 6; entries always send `archivedAt=null` as a string |
| Technical entries | `/technical-entry` list/create; `GET/PATCH/DELETE /technical-entry/:id`; PATCH archive/restore |
| Tags | `/tag` list/create; `DELETE /tag/:id` |
| Shared client | Expected base URL, JSON request payload, `withCredentials: true`; real cookie handling reserved for Part 9 |

All paths in this table are relative to `/api`. Registration **currently
includes `confirmPassword`**, and the backend's CreateUserDto accepts it. Do
not strip it based on a generic convention from another project.

Capture parameters in handlers and assert them in the test body. Avoid throwing
assertion failures inside MSW handlers: they may turn into HTTP errors and
obscure the actual assertion failure.

Example `src/features/projects/api/list-project-details.spec.ts`:

```ts
import { expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'
import { listProjectTechnicalEntries } from './list-project-details'

it('requests only active entries with the project collection defaults', async () => {
  const projectId = '11111111-1111-4111-8111-111111111111'
  let capturedUrl: URL | undefined
  const response = {
    data: [],
    meta: { currentPage: 1, perPage: 6, lastPage: 1, total: 0 },
  }

  server.use(http.get(apiUrl(`/project/${projectId}/technical-entries`), ({ request }) => {
    capturedUrl = new URL(request.url)
    return HttpResponse.json(response)
  }))

  expect(await listProjectTechnicalEntries(projectId)).toEqual(response)
  expect(capturedUrl?.searchParams.get('archivedAt')).toBe('null')
  expect(capturedUrl?.searchParams.get('page')).toBe('1')
  expect(capturedUrl?.searchParams.get('perPage')).toBe('6')
  expect(capturedUrl?.searchParams.has('userId')).toBe(false)
})
```

Also cover a custom page overriding the default, null-clearing PATCH fields,
and propagation of 401/409/422/500 errors to consumers. Do not implement API
validation in handlers; explicit response fixtures are enough.

**Exit criterion:** each schema and utility decision has boundary coverage;
HTTP paths/envelopes/defaults are aligned with the current API. Run focused
suites first, then the frontend suite, lint, and build.

## Part 3 — Authentication and routing

**Goal:** prove that a user can sign in, create an account, view their session,
and move between public/protected routes. This is the first complete vertical
slice: DOM → validation → HTTP → query cache → router.

### 3A. Make the application dependencies testable

The current `router.tsx` creates a browser router at module import, and the
loaders import the production query client. Do this small structural change
with its own tests before rendering the whole app:

1. Extract the route objects into `routes/route-config.tsx`, exporting
   `createAppRoutes(client: QueryClient): RouteObject[]`.
2. Preserve the existing nested route tree and paths exactly.
3. In `require-user.ts`, introduce
   `createAuthLoaders(client: QueryClient)`, returning `requireUser` and
   `redirectAuthenticatedUser`. Move the existing bodies inside that factory
   and replace the singleton reference with the parameter. Keep the current
   `client.query(...)` usage supported by the installed version; do not copy
   an unrelated older TanStack example without checking its API.
4. `createAppRoutes` uses those returned loaders. Production `router.tsx`
   becomes `createBrowserRouter(createAppRoutes(queryClient))`.
5. Add optional `client` and `showDevtools` props to `AppProviders`, defaulting
   to the existing production client and development behavior. The test
   renderer passes its client and `showDevtools={false}`. Keep TooltipProvider
   and Toaster in their existing composition.
6. Do not import production `router.tsx` in tests; import the route factory.

This is dependency injection, not a test-only copy of the application's routes.
It ensures that a loader and `useGetUser` see the same cache. The production
entry point retains one shared client.

After that refactor, proposed `src/test/render-app.tsx`:

```tsx
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AppProviders } from '@/app/providers/app-providers'
import { createAppRoutes } from '@/routes/route-config'
import { createTestQueryClient } from './query-client'

const routers = new Set<ReturnType<typeof createMemoryRouter>>()

export function renderApp(route = '/') {
  const client = createTestQueryClient()
  const user = userEvent.setup()
  const router = createMemoryRouter(createAppRoutes(client), {
    initialEntries: [route],
  })
  routers.add(router)

  const result = render(
    <AppProviders client={client} showDevtools={false}>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return { ...result, user, router, client }
}

export function disposeTestRouters() {
  for (const router of routers) router.dispose()
  routers.clear()
}
```

Call `disposeTestRouters()` after React cleanup and before query disposal in
setup. Rendering RootLayout also requires a working `matchMedia` double for
`useIsMobile`; introduce the minimal desktop version here and extend its change
notifications in Part 8. Use `vi.stubGlobal('matchMedia', ...)` with an object
that provides `matches`, `media`, `addEventListener`, `removeEventListener`,
legacy listener methods, and `dispatchEvent`. Install it per test after global
restoration, and keep listeners per media-query string. A static `false`
implementation only supports desktop setup, not a resize test.

### 3B. Authentication scenario matrix

| Suite | Cases and meaningful assertions |
| --- | --- |
| `login-form.spec.tsx` | Labeled E-mail/Password; empty/invalid fields show errors and send no POST; valid request body; pending submit disabled; only one POST during repeated submit; success toast, cache update and navigation; 401/422/500/network failure keeps form usable and permits retry |
| `register-page.spec.tsx` | Name/email/password/confirmation validation; mismatch on confirmation field; matching data including `confirmPassword` reaches `/users`; pending feedback; 409 duplicate email; success navigates to `/login` without creating an authenticated session |
| `account-page.spec.tsx` | Loading account text while query is held; correct name/email after success; guard when no user; protected route case belongs in router tests, not a mocked account component |
| `require-user.spec.ts` | Authenticated user returned; only 401 becomes `/login` redirect; 403, 500 and network errors propagate; guest loader permits 401, redirects authenticated user to `/`, and propagates other errors |
| `router.spec.tsx` | Guest access to every protected route redirects; signed-in access renders the intended page; signed-in visits to login/register redirect; static `/technical-entries/archived` resolves to archive page rather than entry detail |
| `use-logout.spec.tsx` or sidebar integration | Pending sign-out control; successful logout navigates and removes session; failure must not claim success; account-switch cache regression |

Do not assume AccountPage currently has its own error banner or logout has an
error toast: neither implements that feedback. Record the gap if the desired
UX requires it. Keep a test of the actual route-level error propagation.

A redirected React Router loader throws a `Response`, not an `Error`. In a
focused loader test, capture the rejection and assert status plus its
`Location` header. Do not assert the entire Response serialization.

### Example: a complete form-to-navigation test

Proposed `src/features/auth/components/login-form.spec.tsx` (this example uses
a small explicit route tree; full application routing remains a separate suite):

```tsx
import { expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { http, HttpResponse } from 'msw'
import { LoginForm } from './login-form'
import { currentUserQueryKey } from '../api/get-current-user'
import type { User } from '../types/auth'
import { renderWithProviders } from '@/test/render-with-providers'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'

it('stores the signed-in user and opens the home route', async () => {
  const account: User = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Alex Reader',
    email: 'alex@example.com',
  }
  let submittedBody: unknown

  server.use(http.post(apiUrl('/auth/login'), async ({ request }) => {
    submittedBody = await request.json()
    return HttpResponse.json(account)
  }))

  const { user, client } = renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/" element={<h1>Home destination</h1>} />
    </Routes>,
    { route: '/login' },
  )

  await user.type(screen.getByLabelText('E-mail'), account.email)
  await user.type(screen.getByLabelText('Password'), 'valid-password')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))

  expect(await screen.findByRole('heading', { name: 'Home destination' }))
    .toBeVisible()
  expect(submittedBody).toEqual({
    email: account.email,
    password: 'valid-password',
  })
  expect(client.getQueryData(currentUserQueryKey)).toEqual(account)
  expect(await screen.findByText('Signed in successfully!')).toBeVisible()
})
```

For the full-app version, also handle `/users/me`. Its handler must return 401
before login and the user afterward, because loaders/sidebar may query it.
Never return a logged-in user from every default handler: that would hide
unauthenticated-route defects.

### Pending and failure recipe

Create `src/test/deferred.ts`:

```ts
export function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}
```

In the test, create `const responseGate = deferred<void>()`; the POST handler
awaits `responseGate.promise` before returning. After filling/submitting,
assert `Signing in...` is disabled, attempt another click, and inspect the
captured POST count. Release with `responseGate.resolve(undefined)` in a
`finally` block so a failed assertion cannot leave the request hanging. Await
the final UI before test teardown. Repeat with a 401 response and a later
successful override to cover retry.

### Session isolation regression

Use one application client **inside this one test** to simulate the real
session transition:

1. Sign in as user A, load `/projects`, and hold a background A response.
2. Sign out; verify private content is no longer reachable as a guest.
3. Sign in as user B and navigate to the same list/query key.
4. Release the old A response and verify A's project name never repopulates B's
   screen or cache; B's content is fetched instead.
5. Apply the explicit cache-cancellation/clearing policy in `useLogout` and,
   if needed, session transitions. Keep public configuration separate if future
   non-user queries are added.

**Exit criterion:** all auth outcomes are covered, real loaders share the test
client, and data does not cross sessions. Focused suites, full frontend tests,
lint, and build pass.

## Part 4 — Project lists and creation

**Goal:** cover URL-driven state and the relationship between a form mutation
and the visible list. Implement list rendering first, filters/pagination second,
then creation and failure states.

### Files and scenarios

| Primary suite | Coverage |
| --- | --- |
| `projects/pages/projects-page.spec.tsx` | Pending skeleton, successful cards, empty result, error alert and Try again; background Updating state; each card links to the correct project |
| Same page suite | Default page 1/perPage 10/sort createdAt desc/archivedAt string `null`; valid deep-link filters; invalid page missing/0/negative/fraction/NaN → request page 1; unsupported status omitted |
| Same page suite | Typing is draft-only; Search trims name and sets page 1; All removes status; Clear resets parameters; Next preserves filters; browser-history navigation rehydrates filter inputs |
| `project-form.spec.tsx` | Dialog semantics, field labels, invalid data blocks POST, valid create, pending controls, 409 conflict, 422/server/network error; draft retained on failure; success reset and close |
| `project-list-pagination.spec.tsx` | First/last/single page; fetching disables both controls; callbacks use adjacent page; metadata total formatted en-US |

The private `parsePage` function does not need to be exported for tests. Prove
its effect on the request through the page. Test a large positive page
separately: the current parser accepts it; the API's returned metadata and UI
recovery are a different concern.

### Test data

Proposed `src/test/factories/project.ts`:

```ts
import type { Project } from '@/features/projects/types/project'

export function buildProject(overrides: Partial<Project> = {}): Project {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'DevLog API',
    description: 'Backend learning journal',
    status: 'ACTIVE',
    technologies: [],
    createdAt: '2026-09-01T12:00:00Z',
    updatedAt: '2026-09-14T12:00:00Z',
    ...overrides,
  }
}
```

Use explicit different IDs when a test needs multiple records. Avoid shared
mutable fixture objects and random names. Collection factories should require
coherent `currentPage`, `perPage`, `lastPage`, and `total` overrides; do not infer
`total` from a single page's length when testing pagination.

### Example: a filter changes the URL and the request

Proposed `src/features/projects/pages/projects-page.spec.tsx`:

```tsx
import { expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { useLocation } from 'react-router'
import { http, HttpResponse } from 'msw'
import ProjectsPage from './projects-page'
import { buildProject } from '@/test/factories/project'
import { renderWithProviders } from '@/test/render-with-providers'
import { apiUrl } from '@/test/mocks/urls'
import { server } from '@/test/mocks/server'

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="Current search">{location.search}</output>
}

it('applies a draft search on page one and requests the matching records', async () => {
  const requests: URL[] = []
  server.use(http.get(apiUrl('/project'), ({ request }) => {
    const url = new URL(request.url)
    requests.push(url)
    const filtered = url.searchParams.get('name') === 'API'
    return HttpResponse.json({
      data: [buildProject({ name: filtered ? 'Matching API project' : 'Initial project' })],
      meta: {
        currentPage: Number(url.searchParams.get('page')),
        perPage: 10,
        lastPage: 3,
        total: 21,
      },
    })
  }))

  const { user } = renderWithProviders(
    <><ProjectsPage /><LocationProbe /></>,
    { route: '/projects?page=3' },
  )
  await screen.findByRole('link', { name: 'Initial project' })
  await user.type(screen.getByRole('textbox', { name: 'Name' }), '  API  ')
  expect(requests.some((url) => url.searchParams.has('name'))).toBe(false)

  await user.click(screen.getByRole('button', { name: 'Search' }))
  expect(await screen.findByRole('link', { name: 'Matching API project' }))
    .toBeVisible()
  await waitFor(() => {
    const latest = requests.at(-1)
    expect(latest?.searchParams.get('name')).toBe('API')
    expect(latest?.searchParams.get('page')).toBe('1')
    expect(latest?.searchParams.get('archivedAt')).toBe('null')
  })
  const search = new URLSearchParams(screen.getByLabelText('Current search').textContent ?? '')
  expect(search.get('name')).toBe('API')
  expect(search.get('page')).toBe('1')
})
```

The test's dynamic response is intentionally small: it only distinguishes the
two states needed for this behavior. It is not a search-engine implementation.

### Creation and cache synchronization recipe

1. GET returns an empty collection from local test state.
2. Render ProjectsPage and open New project.
3. Type Name/Description and submit inside `within(dialog)`.
4. POST captures the body and adds a fixed created record to that local state.
5. The invalidated GET now returns the record.
6. Assert success feedback, dialog closure, and the new card without refreshing.
7. Reopen and assert the form has reset. Repeat failure with 409 and assert
   the entered name is retained.

This catches missing invalidation more effectively than only spying on
`invalidateQueries`. Keep handler state inside the test, not at module scope.
Do not assume “create succeeds” means the record must appear under a filter
that excludes it; use an unfiltered list for this scenario.

**Exit criterion:** list states, URL behavior, pagination and creation work
through real hooks/HTTP. Run focused project suites, full web tests, lint/build.

## Part 5 — Project details, editing, and lifecycle

**Goal:** protect the most stateful project interactions. Split delivery into
read-only detail sections, edits, and lifecycle/cache regressions.

### 5A. Detail composition and collection states

Create `project-detail-page.spec.tsx` beside the page. Register handlers for the
parent project and all three collection requests, even when testing Overview.
All four hooks mount immediately in the current implementation.

- [ ] Pending parent → named detail skeleton; successful parent → header and
  Overview; 404 → Project not found and Back to projects.
- [ ] Commands/Resources/Technical entries tabs render their own content.
- [ ] Each collection independently handles pending, empty, error, retry, and
  pagination; one collection failure must not erase the parent project.
- [ ] Changing Commands to page 2 leaves Resources and Entries at page 1.
- [ ] Overview metrics come from `meta.total`, not the number of visible rows.
- [ ] Technologies show name and optional version; missing technologies show
  the existing empty message. There is no technology editor to test yet.
- [ ] Command title, content, optional description and execution order render.
- [ ] Resource labels/types and hrefs match the response; HTTP(S) links open
  in a new tab with the existing `rel` protection. Do not navigate external
  services in tests.
- [ ] Project entry cards preserve their links, type/status labels, dates,
  conclusion preview, and tags when present.
- [ ] Refetching the parent shows Updating project without losing useful data.

If a resource has an unsupported or unsafe URL scheme, treat acceptance or
rejection as a deliberate product/security rule to implement, rather than
making a blanket test that all API-provided URLs must be clickable.

### 5B. Editing

| Proposed suite | Cases |
| --- | --- |
| `project-edit-form.spec.tsx` | Prefilled name/description/status/path; update validation; trimmed name; empty optional description/path become `null`; exact PATCH fields; pending state; successful close; failure retains draft |
| `project-inline-content.spec.tsx` | Markdown display; enter edit; Save sends only description; whitespace-only description clears with `null`; Cancel sends no PATCH and restores server value; error retains draft; next edit reads refreshed props |
| `project-settings-pane.spec.tsx` | Status/ID/dates/path; missing-path message; clipboard success/failure; Copied feedback returns to Copy value after 1.5 s; active versus archived controls |

The edit dialog is keyed by project ID and `updatedAt` on the page. Add a page
scenario in which a fresh GET changes those values and reopening the dialog
shows current data. Do not test that React remounted a particular number of
times; test the actual field values.

**Important cache contract:** update-project's PATCH response may omit
`technologies`. Its hook refetches the complete GET result. Seed a detail with
technologies, return a PATCH without them, and verify that the refreshed detail
still displays them. A naive `setQueryData` replacement should fail this test.
The current detail key is also a prefix of collection keys, so invalidating
it without `exact: true` refreshes those collections too. Account for this in
handlers; see the cache matrix before narrowing the behavior.

### 5C. Lifecycle

| Action | Required scenarios |
| --- | --- |
| Archive | Open confirmation; cancel sends no PATCH; confirm sends archive PATCH; pending disables actions; success refetches detail/lists/collections and shows archived state; failure keeps dialog available |
| Restore | Restore confirmation and cancellation; successful response re-enables edits; collection/list state refreshed; failure remains retryable |
| Delete | Wrong name disables confirmation; `confirmation.trim() === projectName` enables it; matching is case-sensitive; submit once; success removes detail and navigates to `/projects`; failure retains dialog and confirmation |
| Archived project | Settings edit/delete and project-linked New entry disabled; restore available; inline description editing also respects the intended read-only rule after its regression fix |

After deleting an active project with linked entries, verify that those entries
remain accessible and their cached project association is refreshed to match
the API. The Prisma relation uses `onDelete: SetNull`; project deletion does not
delete the journal entries. Cover this with the Part 6 cross-feature cases.

Use `screen.findByRole('alertdialog')` and `within(dialog)` to distinguish a
trigger button from the similarly named confirmation action. Test keyboard
confirmation and focus restoration in Part 8.

For copying, use `userEvent.setup()`'s clipboard support or a scoped clipboard
double. Test a rejected `writeText` promise as well as success. For the 1.5-second
feedback reset use fake timers only in that test and configure
`userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`. Advance the clock
inside React `act` when it causes a state update. Avoid fake timers around MSW
requests unless necessary.

**Exit criterion:** all five detail tabs and every implemented edit/lifecycle
path have success, failure, and cancellation coverage as applicable. Archived
read-only regressions are fixed or explicitly left incomplete. Run relevant
suites, all web tests, lint/build.

## Part 6 — Technical journal

**Goal:** cover both journal routes, detail editing, and the link to projects.
Deliver lists/filters, creation/detail, then lifecycle and cache regressions.

### 6A. Active and archived lists

Create suites beside `technical-entries-page.tsx` and
`technical-entry-archived-page.tsx`. Reuse fixture builders and test-case tables
for equivalent cases, but keep at least one integration test for each actual
route so testing one cannot conceal a bug in the other.

- [ ] Default active request uses `archivedAt: 'null'`; archive request uses
  `archivedAt: 'not-null'`. Clear/Search/page changes retain that route scope.
- [ ] Initial pending, success, empty and error/Try again states.
- [ ] Page parsing: missing, invalid, zero, negative and fractional → request
  page 1. Valid pagination preserves title/type/status.
- [ ] Filters are drafts until Search; title trimmed; filter changes reset page.
- [ ] ISSUE permits OPEN/RESOLVED. LEARNING clears/disables Status and omits it
  from HTTP even for `?type=LEARNING&status=OPEN` entered manually.
- [ ] Unknown type/status values are omitted; All options remove filters.
- [ ] Changing search parameters through history updates the form draft.
- [ ] Card links use the correct entry ID; type/status/tag/date/conclusion
  rendering handles optional fields.
- [ ] First/last page and fetching controls are correct for both lists.
- [ ] `/technical-entries/archived` is never treated as an entry ID by routing.

### 6B. Creation and detail editing

| Suite | Required scenarios |
| --- | --- |
| `technical-entry-form.spec.tsx` | Title/context required, type defaults to ISSUE, LEARNING allowed, invalid submit sends no POST; global create omits projectId; project context sends its UUID; blank conclusion omitted and nonblank conclusion trimmed; pending state; success reset/close; error preserves draft |
| `technical-entry-detail-page.spec.tsx` | Pending, success, 404/back link; optional project association, tags, status, dates, conclusion and archive metadata; each read-only section uses actual data |
| `technical-entry-edit-form.spec.tsx` | Current title prefilled; title boundaries/trim; PATCH contains title only; success close; failure draft retained; fresh server title shown on next edit |
| `technical-entry-inline-content.spec.tsx` | Context validation; conclusion can clear; PATCH changes only selected field; draft/cancel/error/retry semantics; Markdown shown after success; updated server value loaded when editing again |
| Lifecycle button suites or page scenarios | Archive/restore/delete cancel, success, failure, pending control states, notifications and destinations |

There is no project selector in the current creation dialog. The `projectId`
prop comes from ProjectDetailPage. The schema's UUID validation can be unit
tested without pretending that a project-selection widget is rendered.

Unlike project deletion, entry deletion currently has no typed-name
confirmation. Test the actual confirmation dialog, not a copied project flow.
Review archived entry edit/delete rules against
[technical entry use cases](../usecases/technical-entries.md) and the API before
adding a read-only restriction or assuming archive and delete are mutually
exclusive.

### Example: clearing a conclusion sends null and handles refetch

Proposed `src/features/technical-entry/components/technical-entry-inline-content.spec.tsx`:

```tsx
import { expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { TechnicalEntryInlineContent } from './technical-entry-inline-content'
import { useGetTechnicalEntry } from '../hooks/use-get-technical-entry'
import type { TechnicalEntry } from '../types/technical-entry'
import { renderWithProviders } from '@/test/render-with-providers'
import { server } from '@/test/mocks/server'
import { apiUrl } from '@/test/mocks/urls'

const entryId = '22222222-2222-4222-8222-222222222222'

function ConclusionHarness() {
  const { data } = useGetTechnicalEntry(entryId)
  if (!data) return <p>Loading entry...</p>
  return (
    <TechnicalEntryInlineContent
      entry={data}
      field="conclusion"
      label="Conclusion"
      placeholder="Record the conclusion"
      emptyMessage="No conclusion recorded."
    />
  )
}

it('clears only the conclusion and renders the refreshed empty state', async () => {
  let entry: TechnicalEntry = {
    id: entryId,
    title: 'Connection pooling',
    context: 'Investigate connection reuse.',
    conclusion: 'Increase the pool size.',
    type: 'ISSUE',
    status: 'OPEN',
    createdAt: '2026-09-01T12:00:00Z',
    updatedAt: '2026-09-14T12:00:00Z',
  }
  let submittedBody: unknown
  server.use(
    http.get(apiUrl(`/technical-entry/${entryId}`), () => HttpResponse.json(entry)),
    http.patch(apiUrl(`/technical-entry/${entryId}`), async ({ request }) => {
      submittedBody = await request.json()
      entry = { ...entry, conclusion: undefined }
      return HttpResponse.json(entry)
    }),
  )

  const { user } = renderWithProviders(<ConclusionHarness />)
  await user.click(await screen.findByRole('button', { name: 'Edit conclusion' }))
  await user.clear(screen.getByRole('textbox', { name: 'Conclusion' }))
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(await screen.findByText('No conclusion recorded.')).toBeVisible()
  expect(submittedBody).toEqual({ conclusion: null })
  expect(entry.context).toBe('Investigate connection reuse.')
})
```

This deliberately includes the detail query. Rendering the editor with static
props and merely spying on its callback would not prove that the refetched
server value reaches the display.

### 6C. Cross-feature regressions

- [ ] Create an entry from a project; it appears in that project's Entries tab
  and changes the Overview total, without manual refresh.
- [ ] Edit a linked entry title; both global list and project entry card update.
- [ ] Archive a linked entry; it disappears from active/project lists and
  appears in the archive list. Restore reverses this.
- [ ] Delete a linked entry; remove its cached detail and refresh global and
  project collections/totals. Returning to its route cannot show stale data.
- [ ] Editing another project's entry does not invalidate unrelated command or
  resource collections.
- [ ] Unlinked entries work without constructing a query key with an absent
  project ID.

Use the cache matrix below to guide expected synchronization. Update/delete
may need the originating project ID as mutation context because delete returns
no entry body. Prefer explicit mutation variables or deliberately captured
pre-delete cache data; do not invent fields on the DELETE response.

**Exit criterion:** both routes, all existing entry fields and lifecycle actions,
and project synchronization are covered. No tests imply that tag assignment,
attempts, resolve/reopen, or a project picker already exists. Focused suites,
all web tests, lint/build pass.

## Part 7 — Tags and the standalone selector

**Goal:** cover the currently implemented tag library and the most intricate
standalone UI component. Deliver the tag page first, deletion/cache effects
second, and controlled selection last.

### 7A. Tags page and dialogs

| Suite | Scenarios |
| --- | --- |
| `tags-page.spec.tsx` | Default page 1/perPage 12/name ascending; draft Name filter, trimmed search, page reset, Clear, invalid pages, URL history; loading/empty/error/retry/update states |
| `tag-pagination.spec.tsx` | First/last/fetching boundaries; page callback and en-US metadata |
| `tag-form.spec.tsx` | Name validation and trimming; POST success/reset/close; optional `onCreated` receives returned Tag; 409/422/network failure retains data; pending feedback |
| `tag-delete-button.spec.tsx` | Named trigger for the correct tag; confirmation warning; Cancel sends nothing; pending disabled actions; success closes; failure stays open |
| Page deletion scenario | Only the selected row shows deletion progress; removed tag disappears after GET refresh; final row/page behavior |
| TagBadge through list/selector tests | `#name` rendering and supplied tag identity; avoid a snapshot of class strings |

### 7B. Controlled selection: use a real parent

`TagSelector` accepts `value: string[]` and `onChange`. It does not own selected
IDs and currently is not wired into technical entry forms. A test must update
its props when it calls `onChange`; a spy alone would leave it frozen.

Proposed harness for `tag-selector.spec.tsx`:

```tsx
import { useState } from 'react'
import { TagSelector } from './tag-selector'

export function ControlledTagSelector({
  initialIds = [],
  disabled = false,
}: {
  initialIds?: string[]
  disabled?: boolean
}) {
  const [ids, setIds] = useState(initialIds)
  return (
    <>
      <TagSelector value={ids} onChange={setIds} disabled={disabled} />
      <output aria-label="Selected tag IDs">{JSON.stringify(ids)}</output>
    </>
  )
}
```

Use it inside `renderWithProviders`; do not export it if local use suffices.
The output is a test-only observation of the parent's public selection value.
It does not expose TagSelector's internal state.

Required selection cases:

1. Initial empty selection and Choose tags button; GET starts on mount even
   while the picker is closed.
2. Opening picker presents a named dialog, labeled Search tags field, available
   tags, and `aria-pressed` selection state.
3. Selecting adds one ID; selecting again removes it. Badges and parent output
   agree. Removing a badge updates the parent.
4. Searching sends trimmed `name` with page 1/perPage 100/name ascending.
   Wait for results; do not assume a debounce duration or exact keystroke count.
5. Select React, search Docker so React is absent from GET, and verify the
   selected React badge retains its name. This protects `selectedTagDetails`.
6. Initial unknown selected IDs show the existing count fallback; a subsequent
   response containing those IDs replaces the fallback with named badges.
7. Open Create new tag, submit, and verify the new ID is selected, search clears,
   and the tag is not duplicated when refreshed GET also returns it.
8. Failure creating a tag leaves selection unchanged and the creation form
   available; cancel does not create/select an item.
9. Loading/empty/error/Try again/background-update states work in the picker.
10. `disabled` prevents opening, selecting, removing, searching, and creating.
    Cover a rerender changing disabled while the dialog is already open.
11. Parent-driven value changes are reflected even without a picker interaction.
12. Nested picker/create dialogs preserve keyboard focus and Escape behavior in
    a real browser or the later browser component harness.

The current picker requests at most 100 items and has no picker pagination.
Test that actual contract and search behavior; do not claim that every tag in
an arbitrarily large library is loaded.

`useCreateTag` awaits invalidation before `mutateAsync` resolves. Consequently,
`TagForm.onCreated` can run after an active GET refetch. Do not require a
callback-before-refetch ordering based on a comment; hold responses and test
what the user actually sees.

### 7C. Relationship cleanup

Deletion has consequences outside `/tags`, even though assignment UI is not
implemented:

1. Seed an entry detail, global entry list, and linked project entry list with
   the same tag.
2. Delete the tag through the library.
3. Return GET fixtures without the tag after deletion.
4. Verify every currently displayed representation loses the badge; inactive
   views refetch when opened.
5. Fix missing project-collection invalidation without invalidating unrelated
   commands/resources.

**Exit criterion:** library workflows and controlled selection are covered;
relationship refresh is verified, and the document still distinguishes a
standalone selector from persistent entry assignment. Run tag suites,
cross-feature suites, full tests, lint/build.

## Part 8 — Shared UI, accessibility, and browser behavior

**Goal:** cover the browser-dependent gaps left by jsdom. Keep small shared
behavior tests and add a limited real-browser suite.

### 8A. Shared component and hook coverage

| Area | Coverage and layer |
| --- | --- |
| `Markdown` | DOM tests for headings, lists, emphasis, code, links, GFM tables/tasks/strikethrough; raw HTML is not executed and unsafe Markdown links do not become executable links; browser check for long code/table overflow |
| `SearchForm` | Submit/Clear contracts and keyboard Enter through a feature form; no duplicate tests of identical wrappers |
| `FormInput` | Label targets input, error association, `aria-invalid`, disabled propagation through login/project/tag forms |
| `useIsMobile` | Initial desktop/mobile value; notify listeners on media-query change; hook updates; subscription removed on unmount |
| `RootLayout` / Sidebar | Guest versus authenticated navigation; account identity; active route; disabled Soon items; pending session/logout states; desktop collapse and mobile drawer |
| Home | Current heading, rendered Markdown and Test notification feedback; no tests for a future dashboard |
| Providers / entry point | Built app starts, notifications appear, production does not render Devtools; app entry point exercised in browser |
| Skeletons and presentation wrappers | Loading labels/roles covered through pages; no individual skeleton-count or icon snapshots |
| Assets/CSS/generated primitives | Build plus targeted visual inspection/browser tests; no standalone unit tests |

Do not hand-edit shadcn primitive files as part of testing fixes. Repository
instructions require the shadcn CLI for adding/updating library components.
Custom compositions and accessibility fixes around generated components are
allowed. For example, selecting Radix Tabs through shadcn is an implementation
choice for the custom project tabs, not a reason to recreate a primitive by hand.

A media-query double should store a stable object per query and dispatch change
events to listeners. `window.innerWidth = ...` alone does not notify
`useSyncExternalStore`. Keep this in a helper with a documented `setMatches`
operation; test cleanup as well as rendering. Do not broadly silence console
errors or add no-op polyfills until a specific missing API requires one.

### 8B. Browser runner

```bash
pnpm --filter web add -D @playwright/test
pnpm --filter web exec playwright install chromium
```

Add `"test:e2e": "playwright test"` and
`"test:e2e:ui": "playwright test --ui"` to the web scripts. Add
`playwright-report/`, `test-results/`, and `playwright/.auth/` to its gitignore.
Saved browser state can contain session cookies and must never be committed.
Playwright documents [authentication state handling](https://playwright.dev/docs/auth).

Proposed initial `apps/web/playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/mocked',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview --host localhost --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    env: { VITE_API_URL: 'http://localhost:3000/api' },
  },
}))
```

The webServer command executes in `apps/web` when invoked through the filtered
web script. A fresh preview prevents accidentally testing an unrelated local
server or a bundle built with another API URL. `VITE_API_URL` must be present
at **build time** because Vite embeds it. See
[Playwright web server configuration](https://playwright.dev/docs/test-webserver).

Add `tsconfig.e2e.json` extending the app tsconfig, overriding `types` with
`['node']`, `include` with `['e2e', 'playwright.config.ts']`, and using a separate
`tsBuildInfoFile`. Add a `typecheck:e2e` script:
`tsc --project tsconfig.e2e.json --noEmit`. Playwright transpilation does not
replace a TypeScript check. Include its config in this project rather than
leaving it unchecked. Keep Vitest's include restricted to `src`.

### Example: a browser guest deep link

Proposed `e2e/mocked/route-access.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('redirects a guest opening a protected deep link', async ({ page }) => {
  await page.route('http://localhost:3000/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (request.method() === 'GET' && url.pathname === '/api/users/me') {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' }),
      })
      return
    }
    // This scenario has no legitimate need for another API request.
    throw new Error(`Unexpected API request: ${request.method()} ${url.pathname}`)
  })

  await page.goto('/projects/11111111-1111-4111-8111-111111111111')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Sign in', exact: true }))
    .toBeVisible()
})
```

Use scoped `page.route` handlers or reusable functions for each scenario. Do
not also install browser MSW unless a demonstrated need justifies a second
mocking mechanism. Never let an undeclared mocked-suite API request fall
through to a developer's running backend.

### Browser behavior checklist

- [ ] Direct navigation and reload on every existing route; guest/authenticated
  variants where relevant; browser Back/Forward restores filters.
- [ ] At a viewport below the current 768 CSS-pixel breakpoint, Open navigation
  menu opens the drawer; keyboard navigation reaches working links; selecting
  a link and dismissing the drawer behave deliberately.
- [ ] At desktop width, sidebar collapse works and active-route indication is
  correct, including archive versus active entries.
- [ ] Dialog focus starts inside, remains inside while modal, Escape/Cancel
  dismisses when allowed, and focus returns to its trigger.
- [ ] Project tabs have accessible names, selected state and correct panels;
  complete arrow-key/Home/End behavior if the selected tab pattern requires it.
- [ ] Forms have labels and associated errors; invalid field focus is useful;
  submit can be reached and activated with the keyboard.
- [ ] Long Markdown code, tables, descriptions and project paths remain usable
  at narrow widths. Verify in a real browser, not with jsdom dimensions.
- [ ] Loading/error states remain understandable without color or animation.
- [ ] Notification appears in the built app; development tools are absent.

Viewport sizes in Playwright are browser API numbers, not CSS dimensions being
introduced into application styles. Keep application styling changes in the
repository's Tailwind/rem conventions.

For `TagSelector` browser focus tests, it currently has no production route.
Use the rendered-component tests first; if nested-dialog fidelity needs a real
browser, add a dedicated test-only fixture page served only by a separate
fixture Vite config, or use Playwright component testing after evaluating its
compatibility. Do not publish a test route in the application merely to reach
this standalone component. Until then, record this browser check as pending.

Optionally add `@axe-core/playwright` after the basic browser suite works. Run
scoped accessibility scans on login, an open form, the project detail tabs and
mobile drawer. Fix findings and keep keyboard checks; an automated scan is not
complete accessibility coverage.

**Exit criterion:** browser suite, e2e typecheck, Vitest, lint and build pass;
manual keyboard/narrow-layout observations are recorded. Any standalone picker
browser limitation is explicit. Add Firefox/WebKit or screenshot baselines
only after the initial Chromium suite is reliable and the benefit is clear.

## Part 9 — Full-stack journeys, CI, and completion

**Goal:** establish that the built frontend, real authentication, API contracts,
and database work together, then make the checks repeatable. Keep exhaustive
validation and failure cases in the faster suites from Parts 2–7.

### 9A. Prepare an isolated real stack

The existing API e2e suite overrides `TokenProvider` and supplies its own cookie.
It covers backend behavior, but cannot substitute for a browser signing in with
real credentials. The browser suite must start the normal Nest application
without provider overrides or intercepted API responses.

Prerequisites and work items:

- [ ] Resolve the pnpm version discrepancy from Part 0 and record a compatible
  Node version for local runs and CI. Use a frozen lockfile in CI.
- [ ] Prepare an ignored `apps/api/.env.test` from its example, with a dedicated
  test database. Make its credentials match `database-test` in
  `docker/compose.yaml`; use disposable credentials in CI.
- [ ] Set `NODE_ENV=test`, `PORT=3001`, and
  `CORS_ALLOWED_ORIGINS=http://localhost:4173` for the API. The current example's
  `CORS_ALLOWED_ORIGINS=*` is rejected outside development. Correct the example
  during implementation, as well as using an explicit browser origin.
- [ ] Use `JWT_EXPIRES_IN_SECONDS=3600`, the key the service actually reads;
  replace the outdated `JWT_EXPIRES_IN` in the example. Supply a test-only
  `JWT_SECRET`. No JWT or database setting belongs in a `VITE_*` variable.
- [ ] Make `DATABASE_URL` identical for migration, fixture cleanup, and the
  running API. `apps/api/prisma.config.ts` loads `.env.test` with
  `override: true`: exporting a different URL in CI is insufficient if that
  file contains a stale value. Generate the ignored file from the job's test
  configuration and validate the resolved target before migrating or cleaning.
- [ ] Start `database-test` and wait for its health check; generate Prisma's
  client, apply committed migrations, and build the API before Playwright.
  The existing `db:test:up` script starts the database and applies migrations;
  it does not explicitly generate the client or build Nest.
- [ ] Keep database preparation outside Playwright's server startup. A database
  or migration failure should stop the job before any browser launches.

After preparing the environment files, the local preparation sequence is:

```bash
NODE_ENV=test pnpm --filter api exec prisma generate
pnpm --filter api db:test:up
pnpm --filter api build
```

Use one hostname consistently. The proposed browser origin is
`http://localhost:4173` and API origin is `http://localhost:3001`. Mixing
`localhost` with `127.0.0.1` changes cookie/origin behavior. This local HTTP suite
checks the test-environment cookie policy; production HTTPS and Secure-cookie
behavior require a deployment smoke check with the actual origin arrangement.

### 9B. Separate browser configurations and test data

Keep Part 8's intercepted suite as `test:e2e`. Add a separate script so a normal
browser run does not unexpectedly require a database:

```json
{
  "test:e2e:full-stack": "playwright test --config playwright.full-stack.config.ts"
}
```

Proposed `apps/web/playwright.full-stack.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/full-stack',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  outputDir: './test-results/full-stack',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/full-stack', open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'pnpm --filter api start:prod',
      // An unauthenticated 401 establishes HTTP readiness, not database health.
      url: 'http://localhost:3001/api/users/me',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NODE_ENV: 'test',
        PORT: '3001',
        CORS_ALLOWED_ORIGINS: 'http://localhost:4173',
      },
    },
    {
      command: 'pnpm build && pnpm preview --host localhost --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: false,
      timeout: 120_000,
      env: { VITE_API_URL: 'http://localhost:3001/api' },
    },
  ],
}))
```

Playwright supports a server array and accepts a 401 readiness response. The
API script runs in the API package through pnpm filtering; the preview command
runs in `apps/web`. The frontend environment is supplied before its build.
See [Playwright server orchestration](https://playwright.dev/docs/test-webserver).

Add this config to `tsconfig.e2e.json` and its Node ESLint override. Keep browser
fixtures under `e2e/fixtures/`; never import `src/test/setup.ts`, MSW's server,
or Vitest helpers into Playwright. Run mocked and full-stack suites sequentially
locally because both use port 4173 and rebuild `apps/web/dist`. CI can use
separate jobs with separate checkouts. Keep their report/output directories
separate when collecting both in one checkout.

Data isolation design:

1. Give every test a fresh browser context and an account unique to that test
   attempt. Generate emails with a run identifier plus test/retry identity;
   fixed shared emails cause conflicts on rerun. Keep displayed fixture text
   predictable and in English.
2. Register through the real UI in the authentication journey. Other journeys
   may create accounts and prerequisite records through the real HTTP API to
   reduce setup time, then sign in through the browser.
3. Use authenticated HTTP setup only for prerequisites, not to perform the
   action the journey claims to test. A tag relationship can be seeded through
   the backend because the frontend does not yet offer assignment.
4. Track created user IDs in the test fixtures. Add an API-owned, Node-only
   cleanup command using the existing Prisma setup; accept only the tracked
   IDs, validate the test database target and `NODE_ENV=test`, and delete only
   those test users. Their owned data cascades in the current schema. Do not
   add a public cleanup endpoint or import Prisma into the frontend bundle.
5. Run fixture cleanup even after a failed assertion, and close its database
   client. On an ephemeral CI database, job teardown also disposes the database.
   On a local persistent test database, retain a run manifest for narrowly
   scoped cleanup if the process was interrupted.
6. Start with one worker and no full-stack retries. Parallelism can come later
   with independent data and cleanup per worker. Never run a global truncate
   while another API or browser suite is using the same database.

Do not copy `.env` values, cookie values, or saved authentication state into
reports. Prefer per-test login over a shared `storageState` for this small suite.
Do not use `pnpm db:reset` or `db:test:reset` as routine suite preparation.

### 9C. Small full-stack journey inventory

Each row is an independent test with its own setup, rather than one ordered
chain whose first failure invalidates the rest.

| Proposed suite | Actions through the browser | Required outcome |
| --- | --- | --- |
| `session.spec.ts` | Register, sign in, open Account, reload a protected deep link, sign out, revisit the protected link | Registration leaves the user signed out; login creates a usable session; reload retains identity; logout returns the user to login and the next protected request is unauthorized |
| `project-journal.spec.ts` | Create a project, add a linked entry from its Entries tab, edit its title/conclusion, revisit project and reload | Server persists the submitted fields; project card and Overview total reflect the entry; reload proves the result was not only local cache state |
| `entry-lifecycle.spec.ts` | Archive an entry, open the archive route, restore it, then confirm deletion | Active/archive membership and linked project total agree with the server; deleting removes the entry and revisiting its URL shows the existing not-found state |
| `tags.spec.ts` | Create a tag, search for it, confirm deletion; use a seeded relationship for the deletion case | Library updates persist after reload; entry badges disappear without deleting the entry |
| `session-isolation.spec.ts` | Load user A's projects, sign out, sign in as B in the same page/context, revisit the list | A's private data never appears under B's identity; B's request succeeds using B's session |

For the session journey, inspect cookie metadata via the browser context to
check the current `devlog_access_token` cookie's `httpOnly`, `sameSite: 'Lax'`, and
path `/` attributes; confirm its name against the API constant during
implementation. Assert cookie presence/removal without logging its value.
A successful browser-origin `/users/me` request after reload establishes that
CORS, credentialed Axios requests, cookie storage, and Nest verification
cooperate. An APIRequestContext login alone does not establish browser CORS.

Keep the delayed user-A request race in the controlled MSW suite from Part 3;
do not introduce response interception into the full-stack test to reproduce
it. These two tests protect different failure modes.

**Acceptance:** all journeys pass from a prepared empty test database and on a
second run without collisions. Cookie authentication is real, cleanup runs on
failure, no API response is mocked, and missing services produce an actionable
setup failure. Record any lifecycle/cache defect as a regression fix in its
owning part before accepting the corresponding journey.

### 9D. Continuous integration

There is no `.github/workflows` directory in the inspected baseline. If GitHub
Actions is the repository's CI host, create
`.github/workflows/frontend-tests.yml` during this phase. Use equivalent jobs
if another host is selected; the required checks are the same.

| Job | Preparation and commands | Dependency and artifacts |
| --- | --- | --- |
| Frontend quality | Install the reconciled pnpm/Node versions; `pnpm install --frozen-lockfile`; web lint, `test:cov`, build | Starts in Part 1; save `apps/web/coverage` when generated |
| Browser with intercepted API | Frozen install; install Chromium and OS dependencies; `typecheck:e2e`; `test:e2e` | Starts in Part 8; save Playwright report, trace and failure screenshots |
| Browser with real API | Frozen install; isolated PostgreSQL; generated `.env.test`; Prisma generate/migrate; API build; `typecheck:e2e`; `test:e2e:full-stack` | Starts in Part 9; save separate browser reports and API startup diagnostics |

Use `pnpm --filter web exec playwright install --with-deps chromium` on a
supported Linux CI runner. Pin compatible runtime/tooling versions, give jobs
a finite timeout, and upload failure artifacts even when tests fail. See
[Playwright's CI guide](https://playwright.dev/docs/ci). Keep artifact retention
short and access restricted because traces can include session/network data.

For database preparation in CI, choose one owner: a job PostgreSQL service with
explicit migration commands, or the existing Compose `database-test` service.
Do not start both. With a CI service, run
`NODE_ENV=test pnpm --filter api exec prisma migrate deploy` after generating
the aligned environment file; do not invoke `db:test:up`, which starts Docker.

Trigger checks for changes to `apps/web/**`, relevant API contracts, Prisma
schema/migrations, shared packages, the root lockfile/workspace configuration,
and test workflow files. Initially, running on every pull request is simpler
than maintaining path filters that can miss cross-package changes. Keep API
unit/integration checks alongside these jobs; a web pass does not replace them.

Turborepo follow-through:

- Keep `test` finite and `test:watch` separate. If watch is exposed through
  Turbo, mark that task persistent and uncached.
- Add `test:cov` with `coverage/**` outputs if CI invokes it through Turbo.
  The current `test` task lists coverage outputs, but plain `vitest run` does
  not produce a coverage report. Cache behavior must follow actual scripts.
- If adding Turbo tasks for either browser mode, set `cache: false`: the
  real-stack result depends on running services and database state, while the
  initial mocked suite also owns server startup and diagnostic artifacts.
- Verify build cache inputs include `VITE_API_URL` and relevant env files.
  Vite framework inference includes `VITE_*` variables, but env-file handling
  still needs review. Filtered pnpm scripts in this plan bypass Turbo, so
  their fresh preview builds do not depend on this cache configuration.
  See [Turborepo environment inputs](https://turborepo.dev/docs/crafting-your-repository/using-environment-variables).

Do not make quality checks silently optional with `continue-on-error`,
`passWithNoTests`, or permanent skips. Inspect any mocked-browser retry that
passes only on a later attempt; retries are diagnostic evidence of flakiness,
not a repair. Require stable job names in branch protection once the rollout
is working, and ensure all introduced checks actually discover tests.

### 9E. Coverage review and definition of done

Collect the first coverage baseline after meaningful feature suites exist.
Review uncovered branches in authentication, payload normalization, filters,
and mutation synchronization before choosing any percentage threshold. If a
threshold is added, record its rationale and increase it as coverage grows;
do not exclude difficult feature code merely to meet the number.

Completion checklist for the **implementation**, not this proposed document:

- [ ] Parts 0–9 meet their exit criteria, with links to implementing commits/PRs
  and the validation results for each part.
- [ ] Every current surface in the scope inventory has a responsible suite or
  an explicit indirect/manual coverage rationale.
- [ ] Required success, empty, pending, failure, retry, cancellation and URL
  cases are covered where applicable; request shapes match the real API.
- [ ] Cross-feature cases in the cache matrix pass, including active views,
  cached inactive views, project deletion, and account switching.
- [ ] Archived-edit and accessibility findings are resolved or explicitly
  recorded as incomplete acceptance items. Optional enhancements and future
  product features remain separate from required coverage.
- [ ] Vitest, coverage generation, browser typechecking, both browser suites,
  lint and build pass in CI with no focused tests or unexplained skips.
- [ ] Real-stack data setup/cleanup works repeatedly; reports can diagnose
  failures without exposing credentials or depending on a developer's server.
- [ ] Keyboard and narrow-layout observations are recorded. The standalone
  TagSelector's browser coverage is either completed with a fixture harness
  or explicitly recorded as a remaining limitation.
- [ ] Update this plan's status, the learning guide's status, and the repository
  instructions that currently say the frontend has no test runner. Link the
  guides from `docs/README.md` when implementation is introduced.

Record progress per part with: status, implementing commit/PR, commands and
results, covered scenario groups, remaining findings, and the next step.
A checked-off plan must not imply that future tag assignment, solution attempts,
or other excluded product features were delivered.

## Cache synchronization matrix

A mutation can affect several separately cached representations. Use this
matrix to design behavior tests; do not make a spy on `invalidateQueries` the
only assertion. The current key factories live beside their API functions.

| Mutation | Required synchronization | Current behavior / planned work |
| --- | --- | --- |
| Login | Store `currentUserQueryKey`; subsequent protected loaders see the same user | Implemented; test with the injected client in Part 3 |
| Logout/account switch | Cancel old user queries, remove private cached state, prevent late responses/callbacks restoring it | Only current user is removed today; Part 3 regression/fix |
| Register | Navigate to login without populating an authenticated session | Implemented; Part 3 |
| Create project | Invalidate `projectsKeys.lists()` across filters/pages | Implemented; Part 4 |
| Update project | Refresh complete project detail and project lists; preserve technologies omitted by PATCH | Current prefix invalidation also matches project collections; Part 5 |
| Archive/restore project | Refresh project detail, its collection branch and project lists; preserve journal relationships | Implemented with overlapping prefixes; verify behavior in Part 5 |
| Delete project | Remove the project's detail/collection branch; refresh project lists and entry lists/details whose project association becomes null | Project removal already matches child keys; entry synchronization needs a Part 5–6 regression/fix |
| Create entry | Refresh `technicalEntriesKeys.lists()` and, when linked, `projectDetailKeys.technicalEntriesRoot(projectId)` | Implemented; Part 6 |
| Update entry | Refresh `getTechnicalEntryQueryKey(id)`, global entry lists, and linked project entries | Linked project branch missing today; Part 6 regression/fix |
| Archive/restore entry | Refresh entry detail, active/archive global lists, linked project entries and their totals | Implemented when response supplies projectId; Part 6 |
| Delete entry | Remove entry detail; refresh global lists and linked project entries/totals | Linked branch missing; capture projectId before deleting; Part 6 |
| Create tag | Refresh `tagKeys.lists()` including picker searches; controlled parent receives created ID | Implemented; Part 7 |
| Delete tag | Refresh tag lists, global entry lists, entry details, and project entry collections displaying the tag | Project collections missing; Part 7 regression/fix |

### Prefixes, active queries, and hidden false positives

`getProjectQueryKey(id)` is `['project', id]`; collection keys begin with
`['project', id, 'details']`. Query filters match prefixes unless `exact: true`
is supplied. Therefore project removal already removes its cached collections,
and invalidating its detail currently also reaches commands/resources/entries.
Do not claim that those child keys are untouched just because they were not
named separately in the hook.

Invalidation marks matching data stale and normally refetches active queries;
removal discards matching cached entries. Inactive views usually refetch on
mount under the current policy. A direct detail-only change would need
`exact: true` plus deliberate collection invalidations where required. See the
[TanStack Query client reference](https://tanstack.com/query/latest/docs/framework/react/reference/classes/QueryClient).

For an inactive-cache regression, seed realistic data with a nonzero
`staleTime` in that particular test (or set query defaults for the relevant
keys). Part 1's default `staleTime: 0` can otherwise cause a refetch on every
mount and hide missing invalidation. Verify invalidated state before navigating,
then the new visible data afterward. For active views, keep their real queries
mounted and hold the refetch response to observe the transition.

Tag deletion does not currently return affected project IDs. A targeted
predicate matching project technical-entry collection keys can refresh that
branch across projects without refetching commands/resources. Centralize the
matching rule and test it against the actual key factories. This is preferable
to refreshing every query in the app, but it introduces a dependency on the
key structure that must stay documented.

Additional synchronization assertions:

- Use two different pages/filter keys so one successful refresh cannot hide a
  stale sibling cache entry. Assert totals as well as item names.
- An entry mutation must not refresh an unrelated project's commands/resources.
- Test failed mutations: drafts remain and caches are not updated as though
  the server accepted the change.
- Distinguish a rejected mutation from a successful mutation followed by a
  failed refetch. The server may have saved the record even though the list
  could not refresh; inspect current behavior and avoid resubmitting a create
  merely to retry a GET.
- Remove/cancel deleted data deliberately and verify late queries cannot
  restore it. Query cancellation/clearing does not undo server mutations;
  session-transition tests should also consider late mutation callbacks.

## Debugging and maintenance

### Diagnose the failing boundary

| Symptom | First investigation | Avoid |
| --- | --- | --- |
| Missing provider/router error | Match the helper to the component; use real app routes for loaders | Mocking every hook until rendering succeeds |
| Undeclared MSW request | Check API origin, verb, path and eagerly mounted collection queries | Global bypass or a success response for every URL |
| Expected error test passes despite an unexpected request | Enforce the unhandled-request teardown assertion from Part 1 | Treating all network failures as the intended server response |
| Element query is ambiguous | Inspect accessible names and scope with `within(dialog)` or a named region | Picking an index from `getAllByRole` |
| `act` warning or late state update | Await user actions and final UI; release deferred requests; wrap manual timer advancement | Silencing console warnings |
| List updates only after navigation/reload | Inspect query keys, active observers and mutation invalidation | Reloading the page inside the assertion to hide stale UI |
| Test passes alone but fails in the suite | Check singleton clients, handlers, router disposal, timers, cookies and mutable fixtures | Making the suite permanently serial without identifying leaked state |
| CI date/text mismatch | Fix timezone, clock and locale inputs; inspect installed runtime versions | Deriving expected values from the current clock |
| API starts locally but fails in browser tests | Check `.env.test`, CORS allowlist, port, migrations and generated Prisma client | Mocking session responses in the full-stack suite |
| Browser login fails after a successful POST | Inspect cookie metadata, browser-origin requests and credential/CORS settings | Copying a token into localStorage |
| Real-stack tests conflict on rerun | Check unique account identity and scoped cleanup | Resetting the development database |
| Playwright can run but code does not typecheck | Run `typecheck:e2e` and inspect config/helper inclusion | Assuming transpilation validates TypeScript |

Use `screen.debug()` for a relevant DOM fragment and the Testing Library query
error for available roles. For browser failures, inspect the retained trace's
action, DOM snapshot, console and network views before increasing timeouts.
Remove temporary debug output from passing tests.

### Everyday commands after their rollout phases

```bash
# Part 1: fast feedback and an individual file.
pnpm --filter web test:watch
pnpm --filter web test src/features/auth/components/login-form.spec.tsx
pnpm --filter web test:cov
pnpm --filter web lint
pnpm --filter web build

# Part 8: intercepted browser suite and interactive debugging.
pnpm --filter web typecheck:e2e
pnpm --filter web test:e2e
pnpm --filter web test:e2e:ui

# Part 9: requires the isolated database, migrations and API build above.
pnpm --filter web test:e2e:full-stack
```

These commands become available only when their scripts are implemented.
Run the focused regression first, then the affected feature/cross-feature
suites and required checks. Do not start the database for ordinary Vitest or
intercepted-browser tests.

When a feature changes, update the behavior inventory, fixtures and contract
assertions together. Keep factories faithful to DTOs/presenters; database
representations can differ from public values (for example, Prisma's project
`PAUSED` maps to the API/frontend `INACTIVE`). Revisit skipped coverage decisions
when a placeholder becomes an interactive feature. Prefer one meaningful
regression at the cheapest suitable layer over duplicating the same assertion
in every layer.

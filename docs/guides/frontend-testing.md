# Frontend testing: a guide for backend developers

Status: learning guide and proposed strategy. The frontend does **not** have a
test runner yet. The configuration and tests described here will be added
gradually through the [implementation plan](frontend-testing-plan.md).

This guide starts with the concepts. Read it before Part 0 of the plan. Examples
use DevLog's current React, React Router, React Hook Form, Zod, Axios, and
TanStack Query architecture. The existing [API testing guide](testing.md)
continues to describe backend tests.

## 1. What changes when you test a frontend?

The basic process is familiar: arrange inputs, perform an action, and assert
an outcome. The difference is the interface through which you observe that
outcome.

In a backend use-case test, you might call `execute(input)` and inspect its
return value, exception, or repository interaction. In a frontend test, you
usually render a screen, fill fields, press a button, and inspect what the user
can see and do afterward.

| Backend concept | Frontend equivalent in DevLog |
| --- | --- |
| Instantiate a use case with dependencies | Render a component inside its router/query providers |
| Prepare repository records | Prepare HTTP responses and, occasionally, cached data |
| Call a public method | Type, select an option, click, or navigate |
| Check a return value | Check visible content, enabled controls, or the destination route |
| Check a validation exception | Check the field message and that no request was sent |
| Mock a repository | Intercept an HTTP request using MSW |
| Reset a database between tests | Unmount React, reset handlers, and dispose caches/router state |
| Supertest against Nest | Playwright against the website, optionally with the real API |

A useful question is: **what could a user observe if this behavior broke?**
For example, changing the name of a private callback should not break tests.
Submitting a form twice while a request is pending should be caught.

### Example: the login flow

```text
User types into labeled inputs
  → React Hook Form stores the values
  → handleSubmit invokes the Zod resolver
      → invalid: render field errors; do not call the API
      → valid: call useLogin's mutation
          → login() uses the configured Axios client
          → POST /api/auth/login
              → success: populate currentUser cache, show toast, navigate
              → failure: show toast, keep the form available for retry
```

One component integration test can exercise this chain with the real form,
schema, hooks, and HTTP client. Only the remote server response is substituted.
This is different from mocking `useLogin` to return `{ isPending: false }`:
that narrower test cannot detect broken submission or request mapping.

## 2. The test layers we will use

### Unit tests: small decisions without rendering

Use these for schemas, formatting, error normalization, and type guards.
Examples include rejecting a two-character tag name, trimming an entry title,
and turning a Nest message array into one readable sentence.

These tests are quick and precise. They cannot establish that an input is
connected to the right schema or that an error appears beside it.

### Component and page integration tests: the main layer

Render real React UI in a simulated DOM and interact with it. Include the
collaborating code that matters: form state, validation, queries, mutations,
routing, notifications, and HTTP calls. Intercept the network boundary.

For DevLog, most useful tests will live here: project creation, applying URL
filters, canceling inline edits, retaining a draft after an API failure, and
refreshing a list after a mutation.

“Component test” describes what is rendered; “integration test” describes how
many pieces collaborate. A `ProjectForm` test with its real hooks and HTTP
client is both. It does not need PostgreSQL to qualify as integration coverage
of the frontend.

### Browser tests: real navigation and browser behavior

Playwright opens a real browser. Use it for deep links, refresh, session
cookies, focus, mobile navigation, and a small number of complete journeys.

There are two distinct modes:

| Mode | Real pieces | Substituted pieces | What it establishes |
| --- | --- | --- | --- |
| Browser test with intercepted API | Browser, built app, router, DOM, CSS | API responses | Frontend behavior in an actual browser |
| Full-stack end-to-end test | Browser, app, Nest, test database | External services if needed | The deployed pieces work together |

A mocked login response does not prove that the backend sets a usable cookie.
A successful Supertest login does not prove the browser accepts that cookie
under the configured origins. We need a small full-stack suite for that seam.

### Visual and accessibility checks

Visual regression compares screenshots; it catches appearance changes but
requires controlled fonts, viewport, data, and time. Add it selectively after
behavior tests are stable, rather than snapshotting every page immediately.

Accessibility checks include accessible names, error associations, keyboard
operation, focus, and automated rules. They complement manual keyboard and
screen-reader checks. Passing an automated audit alone is not proof that the
whole experience is accessible.

## 3. What each proposed tool does

| Tool | Responsibility | Why it fits this repository |
| --- | --- | --- |
| Vitest | Discover tests; provide assertions, spies, lifecycle hooks, and coverage | Can share Vite configuration and the `@` alias; Jest-like concepts are familiar |
| jsdom | Supply DOM APIs in Node for component tests | A straightforward starting point for forms and pages |
| React Testing Library | Render React and query the DOM | Encourages assertions through the public UI |
| `@testing-library/user-event` | Simulate typing, clicking, selection, and keyboard interactions | Models interactions as sequences rather than single event dispatches |
| `@testing-library/jest-dom` | DOM-specific assertions such as `toBeDisabled()` | Works with Vitest despite the package name |
| MSW | Intercept requests and supply HTTP responses | Keeps Axios and the real feature hooks in the test |
| Playwright | Run browser tests and collect traces | Covers browser behavior that a simulated DOM cannot establish |

Vitest's Vite integration is documented in its [configuration guide](https://vitest.dev/config/).
React Testing Library explains its [user-oriented approach](https://testing-library.com/docs/react-testing-library/intro/).
The [user-event introduction](https://testing-library.com/docs/user-event/intro/)
describes the interaction model, and jest-dom documents its
[Vitest setup](https://github.com/testing-library/jest-dom#with-vitest).
MSW's [Node integration](https://mswjs.io/docs/integrations/node/) explains the
request interception used for component tests.

**Trade-offs:** Jest could also test React, but this app already uses Vite, so
Vitest reduces separate transformation and alias configuration. Starting every
test in a real browser would increase setup and runtime. Starting with jsdom
keeps feedback fast; Playwright supplies the missing browser confidence later.
Vitest Browser Mode remains a possible future option, not a third environment
to introduce during the initial rollout.

## 4. Reading a component test

The following is a proposed test using the helper introduced in Part 1 of the
plan. It is not an installed test yet.

```tsx
import { expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { LoginForm } from './login-form'
import { renderWithProviders } from '@/test/render-with-providers'

it('explains what is missing when the login form is empty', async () => {
  // Arrange: render the real form and its dependencies.
  const { user } = renderWithProviders(<LoginForm />)

  // Act: interact through the same button a person would use.
  await user.click(screen.getByRole('button', { name: 'Sign in' }))

  // Assert: resolver validation is asynchronous from the DOM's perspective.
  expect(await screen.findByText('Enter your password.')).toBeVisible()
  expect(screen.getByLabelText('Password')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
})
```

`renderWithProviders` supplies context that production normally supplies above
the form. `user` represents interactions. `screen` queries the document,
including dialogs and toasts rendered outside the component's root container.

### Choosing queries

| Query | Use when | Example |
| --- | --- | --- |
| `getByRole` / `getByLabelText` | The element must exist now | A submit button or password input |
| `findByRole` / `findByText` | The element should appear asynchronously | A fetched project or validation message |
| `queryByRole` / `queryByText` | Checking absence | A dialog after a successful save |
| `within(element)` | Several areas contain similar controls | The Delete button inside an alert dialog |

Prefer role plus accessible name, then labels and relevant text. Password
inputs should be queried by label; they do not have an implicit `textbox`
role. Avoid CSS selectors, class names, generated IDs, and “the third button.”
Those usually describe implementation rather than intent. See Testing
Library's [query guide](https://testing-library.com/docs/queries/about/).

Use `waitFor(() => expect(...))` for a condition without a convenient DOM
query, such as a captured request. Keep actions outside `waitFor`: its callback
may execute multiple times. Always await `user.click`, `user.type`, and other
asynchronous interactions.

## 5. What to replace, and what to keep real

| Dependency | Default approach |
| --- | --- |
| React, feature hooks, React Hook Form, Zod | Keep real |
| Axios and request functions | Keep real; intercept HTTP using MSW |
| TanStack Query | Fresh real client for each test |
| Router | Real memory router; real route loaders in dedicated routing tests |
| Sonner | Real Toaster for visible feedback; a spy only in focused hook tests |
| Clock | Freeze only for date-sensitive tests |
| Clipboard, media queries | Small explicit doubles for jsdom; browser checks later |
| shadcn/Radix | Use the installed components in feature tests |

A **fixture** is example data. A **factory** creates fresh fixture objects with
overrides. A **stub** supplies a predefined result. A **spy** records calls. A
**mock** often combines replacement behavior and call assertions. MSW handlers
act as the HTTP boundary double; they do not execute backend business rules.

Do not build a complete fake backend inside the test suite. A list-creation
scenario only needs enough local state for a GET to return the newly created
item after POST. Error tests can override one handler with a 409 or 422 response.
Factories should use deterministic values and valid API shapes.

## 6. Asynchronous state is part of the behavior

Test transitions, not just the final screen:

```text
Initial query: pending → success with records | success with no records | error
Mutation: idle → pending → success | error → retry
Refresh: existing records + isFetching → updated records
```

In DevLog, `isPending` can mean there is no usable query result yet, while
`isFetching` also covers background work. A create mutation can remain pending
while its asynchronous success handler waits for list invalidation/refetch.
Therefore a POST response and the disappearance of “Creating...” are not
necessarily simultaneous.

Use controlled promises to hold a response while checking loading controls.
Do not wait an arbitrary number of milliseconds and hope the operation has
finished. Disable automatic retries in the ordinary test client so error cases
finish promptly; test the production retry policy separately.

`useDeferredValue`, used by `TagSelector`, does not specify a debounce interval.
Wait for the resulting UI/request value; do not assert a fictional 300 ms delay
or an exact request count for every keystroke.

## 7. Isolation: the frontend equivalent of database cleanup

Each test must be runnable alone or after any other test:

1. Start with a fresh query client and a known route.
2. Prepare only the responses needed for the scenario.
3. Render, interact, and await the result.
4. Unmount React so subscriptions and observers are released.
5. Dispose the router, cancel pending queries, and clear the cache.
6. Reset HTTP handlers, browser doubles, timers, storage, and relevant cookies.

DevLog currently exports a query-client singleton used by route loaders and
`AppProviders`. Rendering hooks with a fresh provider is insufficient if a real
loader still uses that singleton. Part 3 introduces a small dependency-injection
seam so both use the same per-test client.

This is the same architectural idea as passing a repository into a use case:
the application keeps its normal dependency, while a test controls the instance.

## 8. What frontend tests cannot establish

- jsdom does not establish actual responsive layout, browser cookie policy,
  scrolling geometry, or real clipboard permissions.
- An MSW success response does not prove the API accepts the payload. Keep
  request expectations aligned with DTOs and add full-stack journeys.
- Disabling an action is user experience protection; backend authorization and
  ownership rules remain mandatory.
- A schema test cannot prove a field is labeled or reachable by keyboard.
- Coverage measures executed code, not whether assertions would detect a bug.

Do not aim for one test per file or a 100% percentage. Types, generated
primitives, static assets, and trivial compositions do not all need individual
suites. The plan assigns coverage to behaviors, including indirect coverage
through pages, and records why some files are excluded.

## 9. A practical learning loop

1. Pick one observable behavior and write its expected result in plain English.
2. Choose the cheapest layer capable of proving it.
3. Arrange a realistic success, boundary, or failure input.
4. Write the test using the public interface.
5. Read a failure and check whether it points to the expected problem.
6. For an important new test, temporarily break the relevant behavior locally
   and confirm the test fails. Restore the code before finishing.
7. Run the focused test, the frontend suite, lint, and build as appropriate.

If a test fails because it expects a feature that does not exist, record a
product task. If it uncovers a defect in existing behavior, reproduce and fix
that defect in a focused change with its regression test. Do not redefine the
expected result just to make a failing test green.

Continue with the [detailed implementation plan](frontend-testing-plan.md).

# Frontend testing baseline

This record completes Part 0 of the
[frontend testing implementation plan](frontend-testing-plan.md). It reflects
the repository and local toolchain checked on 2026-09-15, before test
infrastructure was added.

## Toolchain and initial validation

- Node.js: 24.20.0.
- pnpm: 11.21.0, selected from the root `packageManager` field and lockfile.
  `AGENTS.md` was updated from 11.18.0 to the same version so local work and CI
  do not silently rewrite the lockfile with another release.
- `pnpm --filter web lint`: passed.
- `pnpm --filter web build`: passed. Vite reported only its existing warning
  that the main minified JavaScript chunk is larger than 500 kB.
- Vitest 4.1.11 and `@vitest/coverage-v8` 4.1.11 are kept on the same exact
  version. This release supports Node 24 and Vite 8. It was selected instead
  of the just-published 5.0.1 release so the workspace's dependency-age policy
  remains effective without exceptions. The current official installation
  guide's Node 22.12 and Vite 6.4 minimums were also reviewed.

## Test ownership and naming

Pure and HTTP-contract tests use `*.spec.ts`; React tests use `*.spec.tsx`.
Feature tests live beside the source they cover. Shared render helpers, MSW
setup, factories, and test-only clients live under `src/test/`. Browser tests
will use `e2e/**/*.spec.ts` only when Part 8 is implemented.

Parts 0–2 own the runner, reusable test infrastructure, schemas, pure
utilities, presentation mappings, and HTTP request contracts. UI workflows,
route loaders, cache synchronization, browser behavior, and full-stack
journeys remain owned by Parts 3–9.

## Current behavior versus later regression work

The tests in Parts 0–2 characterize current contracts. In particular,
registration sends `confirmPassword`, login has no invented minimum password
length, create-project fields are not assumed to trim, and invalid dates are
left to date-fns rather than given an unimplemented fallback.

The findings already listed in the plan remain regression work for their
assigned later parts: archived project and entry edit affordances, incomplete
cross-list invalidation, user-scoped cache clearing on logout, accessible tab
keyboard behavior, detail error differentiation, and pagination recovery after
deleting a final row. Parts 0–2 do not change those product behaviors.

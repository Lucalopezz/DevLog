---
name: devlog-testing
description: "Choose, implement, and run focused DevLog tests for changed behavior using the existing API and frontend testing infrastructure."
---

# DevLog Testing

Read the applicable [API testing guide](../../../docs/guides/testing.md) or
[frontend testing guide](../../../docs/guides/frontend-testing.md). Confirm
commands and discovery rules in the current package and runner configuration.
Run commands from the repository root using its pinned pnpm version.

## Choose evidence for the change

Identify the observable behavior at risk. Select the smallest layer that can
catch it, including the real collaborators necessary to detect a broken flow.
For a bug, reproduce the failing behavior before the fix when practical.

| Behavior | Appropriate starting point |
| --- | --- |
| Domain transition or use-case decision | API unit test with repository contracts mocked |
| Prisma relations, constraints, or real query semantics | Repository integration test against the test database |
| Nest routing, validation, authentication, and responses | API end-to-end test with Supertest |
| Schema transformation or pure presentation calculation | Vitest unit test |
| Form submission, API feedback, or query refresh | Testing Library with real collaborating code and MSW |
| Deep links, refresh, focus, or responsive interaction | Playwright browser test |

## Follow existing test infrastructure

- API unit discovery expects nearby `__tests__/unit/*.spec.ts`; integration
  discovery expects `__tests__/int/*.int.spec.ts`. API end-to-end tests belong
  in `apps/api/test/*.e2e-spec.ts`. A colocated filename alone is insufficient
  if the runner excludes its directory.
- Use existing integration helpers and verify the test database configuration
  before running database-backed suites. Do not reset development volumes to
  make tests pass.
- Web tests stay beside the protected code. Reuse `src/test/` render helpers,
  factories, and MSW handlers; isolate query caches and router state between tests.
- Prefer accessible queries and user interactions over inspecting component
  internals. Mock the HTTP boundary rather than form or mutation hooks when
  their collaboration is the behavior under test.
- The current Playwright suite in `e2e/mocked/` intercepts API requests. It proves
  browser behavior, not real cookie acceptance or complete API/database wiring.
  State this limit when reporting validation; check existing browser installation
  and the guide before attempting to run it.

## Run and report

Use focused API unit, integration, or end-to-end commands as appropriate. After
frontend code changes, run relevant focused tests plus `pnpm --filter web lint`
and `pnpm --filter web build`; add browser tests for browser-level changes.

Do not manufacture implementation-mirroring tests or blanket coverage targets.
Documentation-only and skill-only edits need relevant artifact validation rather
than application suites. Distinguish passed checks, failures, and checks that
could not run. Explain what the chosen evidence establishes and any material gap.

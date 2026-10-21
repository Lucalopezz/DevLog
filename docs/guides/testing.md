# API testing strategy

## Organization

Each test stays near the implementation it protects, separate from production code:

```text
feature/
  class.ts
  __tests__/
    unit/
      class.spec.ts
    int/
      class.int.spec.ts
```

Jest uses this structure for discovery. `pnpm --filter api test` runs only `__tests__/unit`, while `pnpm --filter api test:integration` runs only `__tests__/int`. End-to-end tests remain isolated in `apps/api/test`.

## Unit or integration?

A unit test replaces external dependencies with mocks and observes the unit's decisions. For a use case, it checks rules, exceptions, and calls to repository contracts.

A Prisma repository can have both kinds of test because they answer different questions:

- Unit tests verify query construction, pagination, sorting, and mapper usage without PostgreSQL.
- Integration tests verify that the query actually works against the schema, foreign keys, enums, and Prisma behavior.

Coverage helps identify untested code but does not replace scenarios with meaningful assertions. There is no artificial global coverage target at this stage.

## Covered boundaries and remaining priorities

Unit tests cover core rules, entities, mappers, repository query construction,
and request validation. Dedicated cases include account credentials, project
name boundaries, query transformations, solution-attempt results, and
owner-scoped technology search. DTO tests use the same whitelist options as the
global validation pipe, so unexpected ownership fields are rejected too.

Technology and resource repository integration tests exercise real PostgreSQL
filters, pagination totals, compound uniqueness, foreign keys, and cascading
project deletion. Query mocks cannot establish these database behaviors.

The HTTP journeys in `auth-session.e2e-spec.ts` and
`project-journal.e2e-spec.ts` use real password hashing, JWT issuance and
verification, cookies, Nest validation, and persistence. They cover account
settings, owner isolation, issue resolution/reopening, tags, attempts,
archive/restore/delete, and preserving journal history after project deletion.
Their shared setup lives in `apps/api/test/support/`; cleanup targets only the
accounts each suite created.

Remaining useful work includes dedicated validation cases for other DTOs and
additional Tag/Technical Entry failure branches. Prefer HTTP coverage for thin
controller wiring and Nest composition; add isolated tests where those layers
make decisions of their own.

Follow the [TDD and regression-test rules](../../AGENTS.md#testing-guidelines).
For an existing behavior, a characterization test may pass immediately. For a
bug fix, first observe the regression test fail for that bug, then implement
the fix and keep both in the same focused commit.

## Running

From the repository root:

```bash
pnpm --filter api test
pnpm --filter api test:cov

pnpm --filter api db:test:up
pnpm --filter api test:integration
pnpm --filter api test:e2e
pnpm --filter api db:test:down
```

The database-backed commands set `NODE_ENV=test` and load `apps/api/.env.test`.
Check that its URL targets the isolated test database and matches the Docker
test service before running them. Repository integration suites clear test
users between cases; run them sequentially with API and browser E2E suites
that use the same database. Never use `pnpm db:reset` merely to run tests.

## Pull request CI

`.github/workflows/ci.yml` runs for pull requests targeting `main`, pushes to
`main`, and manual dispatch. The `quality` check installs the pinned workspace
dependencies, generates Prisma Client, lints without modifying files, builds all
workspaces, type checks browser tests, and runs API, web, and gateway unit tests.
The `integration` check starts a disposable PostgreSQL service, applies the
committed migrations, and runs Prisma repository, Nest HTTP, intercepted browser,
and full-stack browser suites in sequence. The browser suites share a build
directory and port; database suites share the same test database within the job.

CI copies `apps/api/.env.test.example` for these runs. The integration job
replaces the example password with its run ID so the PostgreSQL service and
test clients use the same disposable credential. It connects only to
`devlog_test`; GitHub Actions has no Neon or Vercel production secrets. The
API's local `lint` script includes `--fix`, so
the CI command calls ESLint without that flag: a check should fail on violations
instead of silently editing the runner's checkout.

The repository's `main` ruleset requires a pull request plus successful
`quality`, `integration`, `Vercel`, and `GitGuardian Security Checks` results
before merge. Vercel verifies the Preview build; GitGuardian scans the PR for
secrets. An up-to-date branch is required, so the checks cover the candidate
merge with the latest `main`. A successful merge
triggers a second CI run on `main` and Vercel's automatic Production deployment.
The merge gate validates application behavior against disposable infrastructure;
it does not test an already published Vercel deployment or replace a post-deploy
health and browser check.

For real browser journeys, follow the
[full-stack setup](frontend-testing.md#full-stack-browser-journeys). Their
API-owned cleanup command validates the test database name and limits deletion
to tracked UUIDs with the `e2e-` email prefix and `@example.test` domain.

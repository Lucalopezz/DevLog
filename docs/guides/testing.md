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

For real browser journeys, follow the
[full-stack setup](frontend-testing.md#full-stack-browser-journeys). Their
API-owned cleanup command validates the test database name and limits deletion
to tracked UUIDs with the `e2e-` email prefix and `@example.test` domain.

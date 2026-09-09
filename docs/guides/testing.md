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

## Current priorities

Critical areas already covered include authentication, core use cases, entities, mappers, and the main repositories. The next cycle should follow this order:

1. **P1:** User, Tag, Project, and Technical Entry controllers; presenters; DTOs without dedicated validation tests; ProjectTechnology and ProjectResource integration; remaining Tag and Technical Entry branches.
2. **P2:** Nest modules, `PrismaService`, bootstrap, and simple decorators. Add isolated tests only when these components contain their own logic; composition or E2E tests usually suit them better.

## Running

From the repository root:

```bash
pnpm --filter api test
pnpm --filter api test:cov

pnpm --filter api db:test:up
pnpm --filter api test:integration
pnpm --filter api db:test:down
```

The integration helper clears data only when `NODE_ENV=test`. Never use `pnpm db:reset` merely to run tests.

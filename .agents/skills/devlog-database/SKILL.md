---
name: devlog-database
description: "Change DevLog Prisma models, migrations, repository queries, and persistence constraints while preserving data and domain rules."
---

# DevLog Database

Inspect the affected models in [schema.prisma](../../../apps/api/prisma/schema.prisma),
the migration history, and [database decisions](../../../docs/decisions/database.md).
For execution, inspect [Prisma configuration](../../../apps/api/prisma.config.ts),
[environment setup](../../../docs/guides/configs_workflow.md), and current package
scripts. Treat older model plans as context; reconcile them with the schema.

## Decide the persistence change

- Trace the business operation through its use case, repository contract,
  Prisma implementation, and mapper before changing a table or query.
- Preserve the project's native UUID and timestamp types, explicit table/column
  mappings, domain-supplied identifiers, and database defaults where applicable.
  Do not overwrite an entity's existing ID with a generated persistence ID.
- Explain cardinality, optional relations, uniqueness scope, and deletion effects.
  Distinguish archiving from physical deletion and functional status.
- A pre-insert duplicate check improves the ordinary error response, but only a
  database constraint protects uniqueness against concurrent writes. Match the
  persistence error handling to the existing API behavior.
- Derive indexes from actual filters, ownership scope, joins, and sorting. Avoid
  speculative indexes; explain their read benefit and write/storage cost.
- Use a transaction when multiple writes must succeed together. A transaction
  alone is not a substitute for a uniqueness constraint or an appropriate
  concurrency strategy.

## Prepare a reviewable migration

Inspect the schema diff and generated SQL before applying it. For existing rows,
consider backfills, nullability transitions, renamed columns, and data loss.
Keep the task within its intended environment and authorization; do not apply
development migrations to a production database as an incidental step.

Create a new migration for a new change rather than rewriting previously applied
history. Do not hand-edit generated Prisma client files. Check the installed
Prisma version and actual scripts; verify version-sensitive CLI behavior from
official documentation when it is unclear.

Database reset commands are destructive and require an intentional request for
the affected data removal. Use the separate test database and existing helpers
for integration verification, without exposing `.env` values in output.

## Finish the contract

Update affected model mappers, repository contracts, query filters, API output,
frontend consumers, and documentation when the change requires them. Test real
constraints and query semantics against the test database. Explain which rules
are enforced in the domain, application, and database, and why those protections
are complementary.

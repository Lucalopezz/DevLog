---
name: devlog-backend-domain
description: "Implement DevLog backend rules and use cases with DDD concepts and existing domain, application, and infrastructure boundaries."
---

# DevLog Backend Domain

Read [backend organization](../../../docs/guides/backend_structure.md), the
affected feature in [implemented use cases](../../../docs/usecases/README.md),
and representative entities, use cases, repository contracts, and Nest wiring.
Use [product decisions](../../../docs/decisions/devlog-decisions.md) for intent;
check current implementation because older plans can describe superseded fields.

## Model the behavior first

- State the business invariant, valid transitions, and owner of the operation.
  Distinguish an identity-bearing entity from an immutable value object and an
  aggregate that protects related invariants. Explain a new boundary when it
  changes how callers may modify the domain.
- Capability folders are organizational. `Project` is the documented aggregate
  root for its subordinate capabilities; follow existing aggregate methods
  rather than bypassing their lifecycle checks with a child repository write.
- Check the current distinction between functional state and archiving, and
  between issues and learnings. Do not infer a new status field or transition
  from an older diagram without checking entities and schema.

## Keep responsibilities explicit

- Entities and value objects protect business state. Use the existing validation
  mechanism described in [entity validation](../../../docs/guides/entity_validation_workflow.md)
  where applicable; domain rules must hold outside an HTTP controller too.
- Use cases coordinate ownership, repository contracts, domain operations, and
  application output mapping. They must not handle Express requests, responses,
  cookies, or concrete Prisma queries.
- Infrastructure implements persistence contracts and model mappers, validates
  HTTP DTOs, presents responses, and connects dependencies in Nest modules.
- Distinguish HTTP DTOs, application input/output, domain entities, and database
  models. A database column or transport field is not automatically a public
  domain property.
- The current application layer uses Nest exceptions, and domain validators use
  `class-validator`. Preserve these established trade-offs for ordinary work.
  Greater framework independence is a separate architectural decision, not an
  excuse to refactor the feature while implementing unrelated behavior.

## Complete the affected slice

Trace the change through repository contracts, implementations, dependency
injection, presenters, and the public API. Preserve existing routes and payloads
unless the task changes them. For persisted multi-record invariants, determine
whether database constraints or a transaction are also necessary.

Cover changed rules, invalid transitions, and ownership failures with appropriate
tests. Explain why a rule belongs in its chosen layer, and what the simpler
alternative would sacrifice. Introduce domain events, CQRS, factories, or generic
abstractions only when a concrete requirement makes their cost worthwhile.

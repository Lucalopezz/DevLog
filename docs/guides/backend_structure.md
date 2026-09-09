# Backend module organization

## Main rule

The backend keeps `application`, `domain`, and `infrastructure` as its first organizational level. When a module contains several related capabilities, each layer creates subdirectories with matching names.

For example, the `project` module has `project`, `command`, `resource`, and `technology` capabilities:

```text
project/
  application/usecases/{project,command,resource,technology}/
  domain/entities/{project,command,resource,technology}/
  domain/repositories/{project,command,resource,technology}/
  infrastructure/database/prisma/repositories/{project,command,resource,technology}/
```

This organizes code by **layer, then capability**. A subdirectory does not automatically become a DDD aggregate. `Project` remains the aggregate root; the other directories group code for subordinate entities and operations.

## When to create a subdirectory

Create one when a recognizable capability has multiple artifacts, such as an entity, validator, repository contract, use cases, DTOs, or Prisma implementation. Use the same name in every layer where that capability exists.

Do not create empty directories or apply the rule preemptively to small modules. `user`, `tag`, and `auth` may stay flat while that makes navigation simpler.

Relationships that are not independent entities should use capability names. In `technical-entry`, tag association code lives in `tag-assignment`, avoiding confusion with the `tag` business module.

## Tests

Tests follow the capability they protect and the convention in the testing guide:

```text
capability/
  file.ts
  __tests__/
    unit/
      file.spec.ts
    int/
      file.int.spec.ts
```

The test type stays explicit without separating tests from the code they protect.

## Dependencies

- Prefer direct imports; do not create `index.ts` files just to shorten paths.
- A capability may depend on another capability's contract when a business rule requires it, but a file's directory should represent its primary responsibility.
- Moving files between capabilities must not change HTTP routes, injection contracts, database schemas, or domain behavior.

The database keeps the **technical entry at its core**, with projects as optional context. Tags represent topics or technologies, not projects.

## 1. Logical model

### Main entities

![Relational model](./banco.png)

### Cardinalidades

| Relationship | Cardinality | Explanation |
| -------------------------------- | ------------: | ------------------------------------------------------------------------------ |
| User → Project | 1:N | A user can own multiple projects. |
| User → TechnicalEntry | 1:N | A user can create multiple entries. |
| User → Tag | 1:N | Each user has their own set of tags. |
| Project → TechnicalEntry | Optional 1:N | A project can have multiple entries, but an entry may have no project. |
| TechnicalEntry → SolutionAttempt | 1:N | An issue can have multiple attempts. |
| TechnicalEntry ↔ Tag | N:N | An entry can have multiple tags, and a tag can appear on multiple entries. |
| Project → ProjectTechnology | 1:N | A project can use multiple technologies. |
| Project → ProjectCommand | 1:N | A project can have multiple commands. |
| Project → ProjectResource | 1:N | A project can have multiple links and resources. |

The entry/project relationship is optional, but an entry can be linked to at most one project in the MVP.

---

# 2. Relational model

## `users`

```text
users
-----
id                UUID PK
name              VARCHAR(120) NOT NULL
email             VARCHAR(255) NOT NULL UNIQUE
password_hash     VARCHAR(255) NOT NULL
created_at        TIMESTAMPTZ NOT NULL
updated_at        TIMESTAMPTZ NOT NULL
```

### Notes

- Email must be globally unique.
- Passwords must never be stored directly.
- The name `password_hash` makes it clear that the field contains a hash.

### Generating identifiers and timestamps

Domain entities generate a UUID in the application when created without an `id`, and repositories persist that same value.

In the project's Prisma 7.9 version, `@default(uuid())` generates a UUID in Prisma Client but does not create a PostgreSQL column `DEFAULT`. To also protect direct database inserts, the schema declares:

```prisma
@default(dbgenerated("gen_random_uuid()"))
```

This preserves the UUID supplied by the application. PostgreSQL uses `gen_random_uuid()` only when the insert omits `id`.

Timestamps follow this convention:

```text
id         @default(dbgenerated("gen_random_uuid()"))
created_at @default(now())
updated_at @updatedAt
```

PostgreSQL IDs use the native `UUID` type, and timestamps use `TIMESTAMPTZ`.

---

## `projects`

```text
projects
--------
id                UUID PK
user_id           UUID NOT NULL FK -> users.id
name              VARCHAR(150) NOT NULL
description       TEXT NULL
status            project_status NOT NULL DEFAULT ACTIVE
local_path        TEXT NULL
created_at        TIMESTAMPTZ NOT NULL
updated_at        TIMESTAMPTZ NOT NULL
archived_at       TIMESTAMPTZ NULL
```

### Enum

```text
project_status
--------------
ACTIVE
PAUSED
FINISHED
```

Archiving is controlled by `archived_at`, not by an `ARCHIVED` value in `status`.

This keeps two concepts separate:

- `status`: the project's functional state;
- `archived_at`: record visibility and archiving.

New projects default to `ACTIVE`.

### Unique constraint

```text
UNIQUE (user_id, name)
```

A user cannot have two projects with the same name, but different users may use the same project names.

### About `repository_url`

The initial document placed `repositoryUrl` directly in `Project`, but also defined `ProjectResource` with the `REPOSITORY` type.

The decision was to **remove `repository_url` from `projects`** and store repositories in `project_resources`, because:

- A project may have separate frontend and backend repositories;
- There may be multiple repositories;
- `ProjectResource` already represents this concept.

---

## `technical_entries`

```text
technical_entries
-----------------
id                UUID PK
user_id           UUID NOT NULL FK -> users.id
project_id        UUID NULL FK -> projects.id
title             VARCHAR(200) NOT NULL
type              technical_entry_type NOT NULL
context           TEXT NOT NULL
conclusion        TEXT NULL
resolved_at       TIMESTAMPTZ NULL
created_at        TIMESTAMPTZ NOT NULL
updated_at        TIMESTAMPTZ NOT NULL
archived_at       TIMESTAMPTZ NULL
```

### Type

```text
technical_entry_type
--------------------
ISSUE
LEARNING
```

The initial types are `ISSUE` and `LEARNING`; only `ISSUE` entries can have attempts.

### Issue resolution

A `LEARNING` entry is not meaningfully open or resolved.

The chosen replacement for `status` is:

```text
resolved_at TIMESTAMPTZ NULL
```

In this model:

- `ISSUE` with `resolved_at IS NULL`: open;
- `ISSUE` with `resolved_at IS NOT NULL`: resolved;
- `LEARNING`: `resolved_at` is always null.

The table becomes:

```text
technical_entries
-----------------
id
user_id
project_id
title
type
context
conclusion
resolved_at
created_at
updated_at
archived_at
```

This decision reduces invalid states, such as:

```text
type = LEARNING
status = RESOLVED
```

### Business rules

```text
type != ISSUE -> resolved_at must be NULL
resolved_at != NULL -> conclusion must be provided
```

These rules are validated in the application, without database `CHECK constraints` or triggers.

---

## `solution_attempts`

```text
solution_attempts
-----------------
id                  UUID PK
technical_entry_id  UUID NOT NULL FK -> technical_entries.id
description         TEXT NOT NULL
result              solution_attempt_result NOT NULL
created_at          TIMESTAMPTZ NOT NULL
updated_at          TIMESTAMPTZ NOT NULL
```

### Enum

```text
solution_attempt_result
-----------------------
FAILED
PARTIAL
SUCCESSFUL
```

### Relationship

```text
technical_entries 1 ---- N solution_attempts
```

### Important rule

Only `ISSUE` entries can have attempts.

A `CHECK` cannot easily enforce this rule because it requires querying another table. Enforce it through:

1. A domain/use case rule;
2. An integration test.

The project explicitly defines this rule.

### Deletion

```text
ON DELETE CASCADE
```

Permanently deleting a technical entry must also delete its attempts.

In normal use, however, entries should be archived rather than deleted.

---

## `tags`

```text
tags
----
id                UUID PK
user_id           UUID NOT NULL FK -> users.id
name              VARCHAR(80) NOT NULL
normalized_name   VARCHAR(80) NOT NULL
created_at        TIMESTAMPTZ NOT NULL
updated_at        TIMESTAMPTZ NOT NULL
```

### Constraint

```text
UNIQUE (user_id, normalized_name)
```

The `normalized_name` field can store:

```text
"NestJS"          -> "nestjs"
"Database"       -> "database"
" Docker "        -> "docker"
```

This prevents the same user from creating:

```text
Docker
docker
DOCKER
```

as three different tags.

Each user can only use their own tags.

---

## `technical_entry_tags`

Association table for the N:N relationship.

```text
technical_entry_tags
--------------------
technical_entry_id  UUID NOT NULL FK -> technical_entries.id
tag_id              UUID NOT NULL FK -> tags.id
created_at          TIMESTAMPTZ NOT NULL

PK (technical_entry_id, tag_id)
```

### Why a composite primary key?

The pair already uniquely identifies the association:

```text
technical_entry_id + tag_id
```

An additional `id` field would bring no benefit to the MVP.

### Deletion

```text
technical_entry_id ON DELETE CASCADE
tag_id             ON DELETE CASCADE
```

Deleting a tag or entry removes its associations.

---

## `project_technologies`

```text
project_technologies
--------------------
id                UUID PK
project_id        UUID NOT NULL FK -> projects.id
name              VARCHAR(100) NOT NULL
version           VARCHAR(50) NULL
created_at        TIMESTAMPTZ NOT NULL
updated_at        TIMESTAMPTZ NOT NULL
```

### Constraint

```text
UNIQUE (project_id, name)
```

A technology name is unique within a project. This constraint prevents registering:

```text
Node.js 20
Node.js 22
```

in the same project. This limitation was accepted for the MVP.

Technologies are information specific to one project.

---

## `project_commands`

```text
project_commands
----------------
id                UUID PK
project_id        UUID NOT NULL FK -> projects.id
title             VARCHAR(120) NOT NULL
command           TEXT NOT NULL
description       TEXT NULL
execution_order   INTEGER NULL
created_at        TIMESTAMPTZ NOT NULL
updated_at        TIMESTAMPTZ NOT NULL
```

### Business rule

```text
execution_order must be NULL or greater than or equal to zero
```

The application validates this rule without a database `CHECK constraint`. `execution_order` is not unique within a project, so two commands may share a position.

Commands are documentation only; the system must not execute them in the browser.

---

## `project_resources`

```text
project_resources
-----------------
id                UUID PK
project_id        UUID NOT NULL FK -> projects.id
label             VARCHAR(120) NOT NULL
url               TEXT NOT NULL
type              project_resource_type NOT NULL
created_at        TIMESTAMPTZ NOT NULL
updated_at        TIMESTAMPTZ NOT NULL
```

### Enum

```text
project_resource_type
---------------------
REPOSITORY
DOCUMENTATION
LOCAL_URL
EXTERNAL_URL
OTHER
```

### Constraint

```text
UNIQUE (project_id, url)
```

This constraint prevents registering the same URL multiple times within a project.

---

# 3. Deletion policy

Relationships use these behaviors:

| Relationship | Behavior |
| --- | --- |
| `User` → `Project` | `ON DELETE CASCADE` |
| `User` → `TechnicalEntry` | `ON DELETE CASCADE` |
| `User` → `Tag` | `ON DELETE CASCADE` |
| `Project` → `TechnicalEntry` | `ON DELETE SET NULL` |
| `Project` → `ProjectTechnology` | `ON DELETE CASCADE` |
| `Project` → `ProjectCommand` | `ON DELETE CASCADE` |
| `Project` → `ProjectResource` | `ON DELETE CASCADE` |
| `TechnicalEntry` → `SolutionAttempt` | `ON DELETE CASCADE` |
| `TechnicalEntry`/`Tag` → `TechnicalEntryTag` | `ON DELETE CASCADE` |

Directly deleting a project deletes its technologies, commands, and resources. Associated technical entries are preserved with `project_id = NULL`.

Deleting a user also cascades to their projects, entries, and tags. Deleting those projects cascades to their technologies, commands, and resources.

In normal use, projects and technical entries are archived rather than permanently deleted.

---

# 4. Complete relational diagram

```text
USERS
- id PK
- name
- email UK
- password_hash
- created_at
- updated_at

PROJECTS
- id PK
- user_id FK -> USERS.id
- name
- description
- status
- local_path
- created_at
- updated_at
- archived_at
- UK (user_id, name)

TECHNICAL_ENTRIES
- id PK
- user_id FK -> USERS.id
- project_id FK -> PROJECTS.id NULL
- title
- type
- context
- conclusion
- resolved_at
- created_at
- updated_at
- archived_at

SOLUTION_ATTEMPTS
- id PK
- technical_entry_id FK -> TECHNICAL_ENTRIES.id
- description
- result
- created_at
- updated_at

TAGS
- id PK
- user_id FK -> USERS.id
- name
- normalized_name
- created_at
- updated_at
- UK (user_id, normalized_name)

TECHNICAL_ENTRY_TAGS
- technical_entry_id PK FK -> TECHNICAL_ENTRIES.id
- tag_id PK FK -> TAGS.id
- created_at

PROJECT_TECHNOLOGIES
- id PK
- project_id FK -> PROJECTS.id
- name
- version
- created_at
- updated_at
- UK (project_id, name)

PROJECT_COMMANDS
- id PK
- project_id FK -> PROJECTS.id
- title
- command
- description
- execution_order
- created_at
- updated_at

PROJECT_RESOURCES
- id PK
- project_id FK -> PROJECTS.id
- label
- url
- type
- created_at
- updated_at
- UK (project_id, url)
```

---

# 5. Cross-user constraints

Adding `user_id` columns alone does not fully enforce these rules:

- The entry must belong to the same user as the project;
- The tag must belong to the same user as the entry;
- A user cannot access another user's data.

These rules are declared in the document.

For example, without extra validation, it would technically be possible to save:

```text
technical_entry.user_id = user A
technical_entry.project_id = user B's project
```

## MVP decision

Validate this in use cases:

```text
CreateTechnicalEntry
UpdateTechnicalEntry
AddTagToEntry
```

Before linking:

```text
project.userId === currentUser.id
tag.userId === currentUser.id
entry.userId === currentUser.id
```

## Alternative not adopted

Usar chaves estrangeiras compostas.

In `projects`:

```text
UNIQUE (id, user_id)
```

In `technical_entries`:

```text
FOREIGN KEY (project_id, user_id)
REFERENCES projects (id, user_id)
```

For tags, the association table would also contain `user_id`:

```text
technical_entry_tags
--------------------
technical_entry_id
tag_id
user_id
```

It would then use composite foreign keys.

This improves structural protection but increases Prisma and query complexity. The decision was to keep these validations in the application and cover them with integration tests.

---

# 6. Indexes

```sql
CREATE INDEX idx_projects_user
ON projects (user_id);

CREATE INDEX idx_projects_active
ON projects (user_id, archived_at);

CREATE INDEX idx_entries_user_created
ON technical_entries (user_id, created_at DESC);

CREATE INDEX idx_entries_active_created
ON technical_entries (user_id, archived_at, created_at DESC);

CREATE INDEX idx_entries_project
ON technical_entries (project_id);

CREATE INDEX idx_entries_type
ON technical_entries (user_id, type);

CREATE INDEX idx_entries_resolved
ON technical_entries (user_id, resolved_at);

CREATE INDEX idx_attempts_entry
ON solution_attempts (technical_entry_id, created_at);

CREATE INDEX idx_entry_tags_tag
ON technical_entry_tags (tag_id);

CREATE INDEX idx_technologies_project
ON project_technologies (project_id);

CREATE INDEX idx_commands_project_order
ON project_commands (project_id, execution_order);

CREATE INDEX idx_resources_project
ON project_resources (project_id);
```

The MVP uses the `title` parameter for case-insensitive partial matching on the title only. If search later includes context and conclusion, consider PostgreSQL `tsvector` and a GIN index:

```sql
CREATE INDEX idx_entries_full_text
ON technical_entries
USING GIN (
    to_tsvector(
        'english',
        coalesce(title, '') || ' ' ||
        coalesce(context, '') || ' ' ||
        coalesce(conclusion, '')
    )
);
```

In the MVP, text filtering is based on title. Project, tag, type, and status remain separate structured filters.

---

# 7. Consolidated decisions

The consolidated schema decisions are:

1. **Remove `repositoryUrl` from `Project`** and use only `ProjectResource`.
2. **Replace entry `status` with `resolvedAt`**, because `LEARNING` has no open or resolved state.
3. **Add timestamps to secondary entities**, especially tags, technologies, commands, and resources.
4. **Add normalized tag names** to avoid duplicates caused by case or whitespace.
5. **Defer environments and services**, since they are future extensions rather than part of the MVP core.
6. **Do not create a global technology table yet**. In the current scope, a technology belongs to a project context; global normalization would add complexity without a clear benefit.
7. **Normally generate UUIDs in the domain**, keeping PostgreSQL `gen_random_uuid()` as a fallback.
8. **Make project names unique per user**, technology names unique per project, and resource URLs unique per project.
9. **Allow repeated execution orders** for commands in the same project.
10. **Validate cross-user rules and other invariants in the application**, without composite foreign keys, triggers, or `CHECK constraints`.
11. **Preserve entries when deleting a project**, setting `project_id` to `NULL`, while cascading deletion of project technologies, commands, and resources.
12. **Default new projects to `ACTIVE`**.
13. **Optimize unarchived entry listing** with an index on `(user_id, archived_at, created_at DESC)`, covering filtering and sorting.

This model has **nine tables**, including the `technical_entry_tags` association table. It keeps the MVP small and supports planned features without introducing infrastructure structures outside the product scope.

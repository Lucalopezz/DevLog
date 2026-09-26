# DevLog — Project decisions

## 1. Goal

Create a personal application for recording technical knowledge gained while developing projects.

The primary focus is the **technical journal**, documenting issues, attempts, solutions, and lessons learned. Projects provide context for entries and hold technical and operational information about each application.

The system should answer questions such as:

- In which project did this issue occur?
- Which attempts were made?
- What was the final solution?
- Which technologies were involved?
- How is this project run locally?
- Where are its repositories and documentation?

---

## 2. Main product decision

The system combines two concepts:

1. **Technical journal**, as the primary feature.
2. **Project dashboard**, providing context and organization for technical entries.

A technical entry may relate to a project, but the relationship is optional.

Example:

```text
Technical entry: HttpOnly cookie was not being sent
Project: Barbershop API
Tags: NestJS, Next.js, cookies, authentication
```

A project is not treated as a tag.

- **Project** represents the context in which something happened.
- **Tag** represents the related topic or technology.

In the MVP, a technical entry may be associated with at most one project.

---

## 3. MVP scope

### 3.1 Authentication

- User registration.
- Login.
- Logout.
- Authentication with an `HttpOnly` cookie.
- Each user can access only their own data.

### 3.2 Technical journal

- Create technical entries.
- Edit entries.
- Archive entries.
- Link an entry to a project.
- Add tags.
- Search and filter entries.
- Record solution attempts.
- Mark an issue as resolved.
- Reopen a resolved issue.

### 3.3 Projects

- Create projects.
- Edit projects.
- Archive projects.
- Record technologies used.
- Record important commands.
- Record links and resources.
- Provide the project's local path.
- View related technical entries.

---

## 4. Main entities

### 4.1 User

```text
User
- id
- name
- email
- passwordHash
- createdAt
- updatedAt
```

### 4.2 Project

```text
Project
- id
- name
- description
- status
- repositoryUrl
- localPath
- userId
- createdAt
- updatedAt
- archivedAt
```

The project provides technical context for journal entries.

### 4.3 TechnicalEntry

```text
TechnicalEntry
- id
- title
- type
- context
- conclusion
- status
- projectId?
- userId
- createdAt
- updatedAt
- archivedAt
```

Initial types:

```text
ISSUE
LEARNING
```

#### ISSUE

Used for technical issues encountered during development.

Example:

```text
Title: Cookie is not sent to the backend
Context: Next.js and NestJS running on different ports
Conclusion: Credentials, CORS, and cookie attributes needed configuration
```

#### LEARNING

Used for lessons learned that did not necessarily arise from an error.

Example:

```text
Title: Server Components can render Client Components
Context: Organizing forms in Next.js
Conclusion: The client boundary should stay close to the interactive part
```

### 4.4 SolutionAttempt

```text
SolutionAttempt
- id
- technicalEntryId
- description
- result
- createdAt
```

Possible results:

```text
FAILED
PARTIAL
SUCCESSFUL
```

Attempts exist only for `ISSUE` entries.

`SolutionAttempt` is an entity persisted in its own table, but it is not an independent aggregate root. It belongs to the `TechnicalEntry` aggregate, which allows or rejects new attempts.

```text
TechnicalEntry (aggregate root)
└── SolutionAttempt
```

An attempt is not a global user resource or a child of `Project`. Even when `TechnicalEntry` is linked to a project, resolution history still belongs to the technical entry.

### 4.5 Tag

```text
Tag
- id
- name
- userId
```

Many-to-many relationship:

```text
TechnicalEntryTag
- technicalEntryId
- tagId
```

Tag examples:

```text
NestJS
Laravel
Docker
Cookies
Database
Deploy
Linux
```

### 4.6 ProjectTechnology

```text
ProjectTechnology
- id
- projectId
- name
- version?
```

Examples:

```text
NestJS 11
Node.js 22
PostgreSQL 17
Next.js 16
```

`ProjectTechnology` is an entity in the `Project` aggregate. It is not a reusable global technology: its name and version describe technology usage within that project.

### 4.7 ProjectCommand

```text
ProjectCommand
- id
- projectId
- title
- command
- description?
- executionOrder?
```

Example:

```text
Title: Start the local environment
Command: docker compose up -d
```

`ProjectCommand` is an entity in the `Project` aggregate. The project controls its lifecycle, and it must not be accessed as an independent resource.

### 4.8 ProjectResource

```text
ProjectResource
- id
- projectId
- label
- url
- type
```

Possible types:

```text
REPOSITORY
DOCUMENTATION
LOCAL_URL
EXTERNAL_URL
OTHER
```

`ProjectResource` is also an entity in the `Project` aggregate, following the same lifecycle rule as technologies and commands.

---

## 5. Relationships

```text
User
 ├── Projects
 ├── TechnicalEntries
 └── Tags

Project
 ├── Technologies
 ├── Commands
 ├── Resources
 └── TechnicalEntries (optional relationship)

TechnicalEntry
 ├── Optional Project
 ├── Tags
 └── SolutionAttempts
```

### 5.1 Aggregate boundaries

A relationship between two entities does not mean they belong to the same aggregate. `Project` and `TechnicalEntry` are separate aggregate roots:

```text
Project (aggregate root)
 ├── ProjectTechnology
 ├── ProjectCommand
 └── ProjectResource

TechnicalEntry (aggregate root)
 └── SolutionAttempt
```

The relationship between `Project` and `TechnicalEntry` is contextual and optional:

```text
Project ──────── optional relationship ──────── TechnicalEntry
```

This allows a technical entry to exist without a project, be linked or unlinked later, and remain preserved when the project is archived. `TechnicalEntry` must therefore not be handled, changed, or have its lifecycle managed as part of the `Project` aggregate.

Responsibilities are separated as follows:

| Aggregate | Child entities | Ownership rule |
| --- | --- | --- |
| `Project` | `ProjectTechnology`, `ProjectCommand`, `ProjectResource` | Each entity belongs to one project and cannot exist outside it. |
| `TechnicalEntry` | `SolutionAttempt` | Each attempt belongs to one entry and exists only for `ISSUE`. |
| `Tag` | None of the entities above | Independent user resource related to entries through `TechnicalEntryTag`. |

Child entities may have their own classes, tables, and repositories for persistence. However, use cases must enter through the appropriate aggregate root and respect its invariants. A dedicated repository does not make a child entity an aggregate root.

### 5.2 Defined module organization

Modules should reflect aggregate boundaries:

```text
project/
├── domain/
│   ├── entities/
│   │   ├── project.entity.ts
│   │   ├── project-technology.entity.ts
│   │   ├── project-command.entity.ts
│   │   └── project-resource.entity.ts
│   └── repositories/
│       ├── project.repository.ts
│       ├── project-technology.repository.ts
│       ├── project-command.repository.ts
│       └── project-resource.repository.ts
├── application/
│   └── usecases/
│       ├── add-project-technology.usecase.ts
│       ├── remove-project-technology.usecase.ts
│       ├── add-project-command.usecase.ts
│       ├── update-project-command.usecase.ts
│       └── remove-project-command.usecase.ts
└── infrastructure/
```

```text
technical-entry/
├── domain/
│   ├── entities/
│   │   ├── technical-entry.entity.ts
│   │   └── solution-attempt/
│   │       ├── solution-attempt.entity.ts
│   │       └── solution-attempt-result.enum.ts
│   └── repositories/
│       ├── technical-entry.repository.ts
│       └── solution-attempt.repository.ts
├── application/
│   └── usecases/
│       └── add-solution-attempt.usecase.ts
└── infrastructure/
    ├── dto/
    │   └── add-solution-attempt.dto.ts
    └── database/
        └── prisma/
            └── repositories/
                └── solution-attempt-prisma.repository.ts
```

`AddSolutionAttempt` must find the `TechnicalEntry`, validate the authenticated user, `ISSUE` type, and archive state, and only then create the child entity. The endpoint stays nested in the entry context:

```text
POST /technical-entry/:entryId/solution-attempts
```

Likewise, operations on technologies, commands, and resources must validate `projectId`, project ownership, and resource membership before making changes.

---

## 6. Initial business rules

### Authorization

- A user can access only their own projects, entries, and tags.
- An entry can only be linked to a project belonging to the same user.
- A tag can only be used by its creator.

### Technical entries

- Only `ISSUE` entries can have solution attempts.
- A resolved issue must have a conclusion.
- Reopening an issue preserves the entire attempt history.
- Archived entries do not appear in the main list.

### Projects

- Archived projects do not appear in the main list.
- An archived project must not receive new technical entries.
- Commands, technologies, and resources belong to a single project.

### Security

- The system will not store passwords, tokens, keys, or real `.env` values.
- It may store only the names of expected variables.

Example:

```text
DATABASE_URL
JWT_SECRET
COOKIE_DOMAIN
```

---

## 7. MVP use cases

### Authentication

```text
RegisterUser
AuthenticateUser
LogoutUser
```

### Projects

```text
CreateProject
UpdateProject
ArchiveProject
GetProject
ListProjects
AddProjectTechnology
AddProjectCommand
AddProjectResource
```

### MVP technology scope

In the MVP, `ProjectTechnology` can be created, listed, and removed. Editing `name` or `version` is a post-MVP feature, so the domain entity does not need an update operation yet.

### Technical journal

```text
CreateTechnicalEntry
UpdateTechnicalEntry
ArchiveTechnicalEntry
GetTechnicalEntry
ListTechnicalEntries
AddTagToEntry
AddSolutionAttempt
ResolveTechnicalIssue
ReopenTechnicalIssue
```

The entry/project association can be set while creating or updating an entry, without requiring a separate use case.

---

## 8. Initial screens

### `/login`

- User login.

### `/register`

- User registration.

### `/technical-entries`

Main technical journal list.

Filters:

```text
Title search
Type
Status
```

Project and tag filters remain planned frontend work.

### `/technical-entries/:technicalEntryId`

Currently displays:

```text
Title
Type
Context
Conclusion
Related project
Tags
Status
Archive/restore/delete actions
```

Solution attempts and resolve/reopen actions remain planned frontend work.

### `/projects`

List of registered projects.

### `/projects/:projectId`

Currently displays:

```text
General information
Technologies
Commands
Links and resources
Related technical entries
Settings and lifecycle actions
```

There is currently no dedicated tag screen in the web application. Tag
assignment and removal in the entry UI remain planned frontend work.

---

## 9. Planned architecture

### Backend

- NestJS.
- Apply DDD only where real rules exist.
- Clean Architecture.
- Unit tests for domain and use cases.
- Integration tests for persistence and controllers.
- PostgreSQL.
- Prisma or another persistence tool chosen during implementation.

Suggested structure:

```text
src/
  modules/
    auth/
    users/
    projects/
    technical-entries/
    tags/
```

Internal module structure:

```text
domain/
application/
infrastructure/
```

### Frontend

- React, Vite, and TypeScript.
- React Router for browser navigation.
- React Hook Form.
- Zod.
- TanStack Query for remote data and cache synchronization.
- Tailwind CSS, shadcn/ui, Radix UI, and Lucide for the interface.

### Local deployment

- Docker Compose for PostgreSQL.
- Vite frontend development server.
- NestJS API.
- Nginx or Caddy as a future reverse proxy.

Current local development topology:

```text
Browser
  |-- http://localhost:5173 -> Vite/React
  |-- http://localhost:3000/api -> NestJS
                                      |
                                   PostgreSQL
```

---

## 10. Initial implementation order

> This order is the original product plan. The current delivery status is
> tracked in [`../backlog/backend.md`](../backlog/backend.md) and
> [`../backlog/frontend.md`](../backlog/frontend.md); the frontend is now
> implemented with React/Vite rather than the original Next.js proposal.

```text
1. Basic authentication
2. Technical entries
3. Tags and search
4. Projects
5. Entry/project relationships
6. Attempts and issue resolution
7. Project technologies, commands, and links
8. Integration tests
9. Frontend
10. Local deployment with Docker Compose and a reverse proxy
```

The technical journal should be implemented before the detailed project dashboard because it is the product core.

---

## 11. MVP completion definition

The MVP is complete when users can:

1. Create an account and authenticate with an `HttpOnly` cookie.
2. Create a project.
3. Add technologies, commands, and links to the project.
4. Create a technical entry.
5. Optionally link the entry to a project.
6. Add tags to the entry.
7. Record solution attempts for an issue.
8. Mark the issue as resolved.
9. Reopen an issue while preserving its history.
10. Search entries by title, content, project, or tag.
11. Run the entire application with Docker Compose.
12. Access frontend and backend through a local reverse proxy.

---

## 12. Features outside the MVP

The initial version will not include:

- Advanced Markdown editor.
- File uploads.
- Sharing between users.
- Comments.
- GitHub integration.
- Artificial intelligence integration.
- Kanban or task management.
- Browser command execution.
- SSH access.
- Continuous monitoring.
- Real-time log viewing.

These features would increase scope without strengthening the main project goal.

---

## 13. Post-MVP project environments

Project environments were added after MVP 1.0 as documented execution or
deployment contexts. Each environment belongs to exactly one project and has a
name, a category (`LOCAL`, `DEVELOPMENT`, `TESTING`, `STAGING`, `PRODUCTION`, or
`OTHER`), and optional operating-system, runtime, runtime-version, and
description fields. Frameworks such as Next.js remain project technologies;
an environment describes where and under which conditions they run.

Names are unique within a project after trimming and case normalization. The
database stores a separate normalized name and enforces this rule with a
composite unique constraint. An archived project's environments stay visible
but cannot be changed; permanent project deletion cascades to them.

The project detail Environments tab manages records. `/environments` searches
all environments owned by the authenticated user, with category and project
filters plus pagination. Filters live in the URL. The API routes and current
flows are recorded in [project use cases](../usecases/projects.md#uc-44--create-project-environment).

The environment model intentionally has no service, host, port, health-check,
credential, or arbitrary key-value configuration fields. Service monitoring,
deployment control, and secret storage would require separate product and
security decisions. DevLog does not execute commands or inspect Docker, SSH,
cloud services, or logs through environments.

---

## 14. Decision summary

The product is a personal technical knowledge base organized by project context.

```text
Technical journal = product core
Projects = context and organization
Tags = classification by topic or technology
Environments = documented project runtime contexts
Activity Timeline and Knowledge Overview = post-MVP roadmap
Services = later extension
```

The priority is a small, useful application that can be used early, avoiding features that distract from its main goal.

# Backend backlog — DevLog

This document lists the tasks needed to implement the DevLog backend, following the use cases and implementation order in [`docs/usecases/cases.md`](../usecases/cases.md).

Scope: NestJS API, application layer, domain, persistence, authentication, authorization, and tests. The frontend backlog will be created separately.

The authentication walkthrough is in [`docs/guides/authentication_workflow.md`](../guides/authentication_workflow.md).

> [!NOTE]
> Mark a task complete only when a verifiable backend implementation exists. A Prisma table alone, for example, does not mean its use case and endpoints are ready.

> [!NOTE]
> Review on 2026-09-20: the API use cases for the MVP project and technical
> journal workflows are implemented and documented under [`../usecases/`](../usecases/).
> Tag filtering is implemented. Remaining unchecked items below track targeted
> test coverage and follow-up design work; they do not mean that the shipped
> project and issue workflows are unavailable.

## Cross-cutting rules

- [x] Ensure every resource has a verifiable owner: direct `userId` for users, projects, entries, and tags; children use their parent project or entry ownership.
- [x] Prevent reading, changing, or logically deleting another user's resources.
- [x] Define the documented states and types:
  - [x] `TechnicalEntry.type`: `ISSUE` or `LEARNING`.
  - [x] Issue status: the entity returns `OPEN` when `resolvedAt` is empty and `RESOLVED` when populated; the MVP has no separate status column.
  - [x] Project status: `ACTIVE`, `INACTIVE`, or `FINISHED`; enum, validation, and updates exist. `archivedAt` is independent of status (`INACTIVE` maps to `PAUSED` in Prisma).
  - [x] Attempt result: `FAILED`, `PARTIAL`, or `SUCCESSFUL` in Prisma.
- [ ] Standardize validation, authentication, authorization, and resource-not-found errors.
- [x] Define DTOs, input validation, HTTP responses, and contracts for every endpoint.
- [x] Create unit tests for the main domain rules and use cases; specific coverage gaps remain listed below.
- [ ] Create end-to-end tests for the main HTTP flows.

## 1. Shared foundation

- [x] Define feature modules in `apps/api/src/`: shared, user, auth, and technical-entry.
- [x] Define entities, identifiers, creation/update dates, and the logical archiving strategy.
- [x] Configure the database schema and initial migration for users, projects, entries, tags, and relationships.
- [x] Define shared repository interfaces and those for users, projects, technical entries, and tags.
- [x] Implement Prisma adapters for users, projects, technical entries, entry/tag relationships, and tags.
- [ ] Implement global exception handling.
- [x] Centralize global API configuration in `applyGlobalConfig`, including `/api`, cookie parsing, CORS, serialization, and validation.
- [x] Configure global `ValidationPipe` with status `422`, `whitelist`, `forbidNonWhitelisted`, and `transform`.
- [x] Enable CORS `credentials: true` to send authentication cookies from a frontend on another origin.
- [x] Configure JWT in an HttpOnly cookie; logout clears the cookie because the strategy is stateless.

## 2. Users and authentication

### RegisterUser

- [x] Create `CreateUserUseCase`.
- [x] Validate `name`, `email`, and `password`.
- [x] Reject registered emails through findUserByEmail.
- [x] Hash the password before persisting the user.
- [x] Never return or store plaintext passwords.
- [x] Create the registration endpoint.
- [ ] Test valid registration, invalid and duplicate emails, and passwords below minimum requirements.

### AuthenticateUser

- [x] Create the `AuthenticateUser` use case.
- [x] Find the user by email.
- [x] Compare the supplied password with the stored hash.
- [x] Return an error without revealing whether the email or password is wrong.
- [x] Generate a JWT after valid authentication.
- [x] Send the token in an HttpOnly cookie with configured `secure`, `sameSite`, `maxAge`, and `path` attributes.
- [x] Create `POST /api/auth/login`.
- [x] Test valid login, missing user, incorrect password, and cookie creation.

### GetCurrentUser

- [x] Create the `GetCurrentUser` use case.
- [x] Create the guard that identifies the authenticated user through the JWT cookie.
- [x] Create `GET /api/users/me`.
- [x] Return only current user public data.
- [ ] Test authenticated and unauthenticated access.

### UpdateUser

- [x] Create the `UpdateUser` use case.
- [x] Allow changing only the user name.
- [x] Keep email immutable after registration.
- [x] Create `PATCH /api/users/me`, using the user identified by the guard.
- [ ] Test valid updates, missing users, and unauthenticated update attempts.

### UpdateUserPassword

- [x] Create the `UpdateUserPassword` use case.
- [x] Validate the new password confirmation.
- [x] Hash the new password before persistence.
- [x] Create `PATCH /api/users/me/password`, using the user identified by the guard.
- [x] Require authentication and `currentPassword` to validate the current password; use it only for validation and never persist it.
- [ ] Test valid updates, invalid current passwords, mismatched confirmation, and missing users.

### LogoutUser

- [x] Create a stateless logout flow; there is no persisted session to invalidate.
- [x] Clear the authentication cookie.
- [x] Create `POST /api/auth/logout`.
- [ ] Test ending authentication and invalid-session behavior.

## 3. Technical entries — initial MVP

> The domain layer has an entity, enum, validation, repository contract, mapper,
> and Prisma repository. Creation, paginated listing, retrieval, updates, hard
> deletion, logical archiving/restoration, solution attempts, and resolution
> have use cases, presenters, and AuthGuard-protected endpoints. Project/tag
> relationships include ownership validation and tag aggregation in responses.
> Tag assignment/removal, solution attempts, and issue resolution have dedicated
> endpoints. The project detail experience composes the project response with
> separate paginated endpoints for entries, commands, and resources; those
> collections are not returned by one aggregate endpoint.

### CreateTechnicalEntry

- [x] Create the technical entry entity.
- [x] Create the `CreateTechnicalEntry` use case.
- [x] Validate `title`, `type`, `context`, and `conclusion?` in the DTO and domain.
- [x] Add `projectId?` to creation and validate its reference.
- [ ] Add `tags?` to creation and validate their references.
- [x] Accept only `ISSUE` and `LEARNING` in the entity and Prisma schema.
- [x] Create `ISSUE` entries without `resolvedAt`; the entity treats the entry as `OPEN` while this date is absent.
- [x] Define `TechnicalEntryStatus` in the domain and derive status in the entity, leaving the mapper only to expose it.
- [x] Allow an optional conclusion on creation, following the use case.
- [x] Optionally associate the entry with a project owned by the same user, rejecting missing, foreign-owned, or archived projects.
- [ ] Associate supplied tags only if they belong to the same user.
- [x] Create authenticated `POST /api/technical-entry`.
- [x] Test `ISSUE` creation, entries without projects, another user's project, and archived projects.
- [ ] Complete creation tests for `LEARNING`, invalid data, missing projects, and tags.

### GetTechnicalEntry

- [x] Create the `GetTechnicalEntry` use case.
- [x] Support lookup by identifier in the contract and Prisma repository.
- [x] Return the entry with `projectId`, associated tags, and derived status for `ISSUE`.
- [x] Keep project details and solution attempts on their dedicated endpoints; the frontend composes the entry detail experience from those responses.
- [x] Ensure the current user cannot find another user's entry.
- [x] Create authenticated `GET /api/technical-entry/:id`.
- [x] Unit-test basic retrieval and user isolation.
- [ ] Test missing entries and complete responses with relationships.

### ListTechnicalEntries

- [x] Create the listing use case as `SearchTechnicalEntryUseCase`.
- [x] Support pagination and sorting in the Prisma repository.
- [x] Support repository filters for `userId`, `projectId`, title, type, and archiving.
- [x] List only authenticated user entries, overriding external values with the guard-provided `userId`.
- [x] Define `title` as the official text search parameter and apply case-insensitive partial matching in the repository.
- [x] Implement `projectId` and `type` filters in the use case/API.
- [x] When `projectId` is supplied, validate that the project exists and belongs to the authenticated user.
- [x] Implement and validate the `tagId` filter through the API and Prisma repository.
- [x] Implement `status` filtering, validating the enum and mapping `OPEN`/`RESOLVED` to `resolvedAt` conditions restricted to `ISSUE`.
- [x] Expose pagination and sorting through the DTO, use case, and collection presenter.
- [x] Keep `perPage` without a maximum, following the product decision to let users choose page size.
- [x] Create authenticated `GET /api/technical-entry`.
- [x] Create authenticated `GET /api/project/:id/technical-entries`, reusing the paginated entry use case.
- [x] Test DTO conversion/validation, use case mapping, and presenter `data`/`meta` format.
- [x] Test missing or foreign-owned projects in the search filter.
- [ ] Test the Prisma repository and filter combinations, and verify through HTTP that other users' results are never returned.

### UpdateTechnicalEntry

- [x] Create the `UpdateTechnicalEntry` use case.
- [x] Allow changing `title`, `context`, and `conclusion`; clear the conclusion only while the entry is unresolved.
- [x] Prevent changing `type` through the API after creation by omitting it from the DTO and use case input.
- [x] Allow changing or removing the project only after validating ownership and unarchived state.
- [ ] Allow replacing or removing tags through `UpdateTechnicalEntry`; currently dedicated assignment/removal use cases own this responsibility.
- [x] Validate that the new project belongs to the user and is not archived.
- [x] Validate tag ownership in assignment/removal use cases; `UpdateTechnicalEntry` does not receive tags directly.
- [x] Create authenticated `PATCH /api/technical-entry/:id`.
- [x] Reject updates without editable fields.
- [x] Unit-test content updates, conclusion/project removal, and user isolation.
- [ ] Test missing entries, foreign-owned projects/tags, DTO validation, and attempted type changes through the API.

### DeleteTechnicalEntry — current implementation to review

- [x] Create `DeleteTechnicalEntry` with an ownership check.
- [x] Create authenticated `DELETE /api/technical-entry/:id` returning `204 No Content`.
- [x] Unit-test deletion and user isolation.
- [x] Decide whether hard deletion remains part of the product or is replaced by `ArchiveTechnicalEntry`, as described in the use cases and archiving backlog. In the MVP, hard deletion remains available through `DELETE /api/technical-entry/:id`; logical archiving explicitly preserves the entry.
- [x] Document that hard deletion also removes attempts and tag relationships through `ON DELETE CASCADE`, following the Prisma schema.

### Pending items found during review

> The E2E items below were deferred to the dedicated HTTP testing stage; tag unit and integration flows are already implemented.

- [x] Create unit tests for `CreateTechnicalEntryUseCase`.
- [x] Create technical entity tests.
- [ ] Expand Prisma repository tests; status filter mapping and some persistence flows are covered, but other filter combinations are not directly exercised.
- [x] Fix Jest E2E configuration to resolve relative `.js` imports in generated Prisma Client.
- [x] Apply `applyGlobalConfig` in E2E bootstrap so tests exercise production `/api`, validation, cookies, and serialization.
- [ ] Replace the legacy `GET /` E2E test with technical entry creation, listing, retrieval, update, and deletion flows.
- [x] Validate UUIDs in creation/update `projectId` and `:id` parameters; previously only search `projectId` used `@IsUUID`.
- [x] Validate database limits, especially the 200-character `title` maximum, to return input errors instead of persistence errors.
- [x] Fix the `SearchTechnicalEntryUseCase` paginated-output test to always supply required `userId`.
- [x] Encapsulate domain transitions: `conclude()` must accept only `ISSUE` and require a conclusion; type changes, resolution, and archiving must not be generic updates.
- [x] Standardize filenames and symbols still using `technicalEntry`/`techinicalEntry` to kebab-case and fix the typo separately from new features.

## 4. Tags

### CreateTag and ListTags

- [x] Create the tag entity and repository.
- [x] Create the `CreateTag` use case.
- [x] Validate `name`.
- [x] Prevent duplicate tag names for the same user.
- [x] Create the `ListTags` use case.
- [x] List only authenticated user tags.
- [x] Create creation and listing endpoints.
- [x] Unit- and integration-test duplicates, user isolation, and listing.

### Relate tags and entries

- [x] Create the tag/technical entry relationship.
- [x] Create the `AddTagToTechnicalEntry` use case.
- [x] Validate that the tag and entry belong to the authenticated user.
- [x] Prevent duplicate relationships between the same tag and entry.
- [x] Create the `RemoveTagFromTechnicalEntry` use case.
- [x] Remove only the relationship, preserving the tag.
- [x] Create endpoints to add and remove relationships.
- [x] Test valid relationships, foreign-owned references, idempotency, and removal without deleting the tag.

## 5. Projects — initial MVP

### CreateProject

- [x] Create the project entity.
- [x] Create the `CreateProject` use case.
- [x] Validate `name` and `description?`; creation sets `ACTIVE`, and `localPath` is not yet part of this flow.
- [x] Require a name.
- [x] Associate the project with the authenticated user.
- [x] Default initial project status to `ACTIVE` when omitted.
- [x] Create the creation endpoint.
- [x] Test valid creation, missing description, association with the correct user, and duplicate names per user.
- [ ] Test DTO input validation, including a missing name.

### GetProject and ListProjects

- [x] Create the `GetProject` use case.
- [x] Return the project with its technologies; expose commands and resources through separate paginated endpoints for the frontend detail view.
- [x] Expose related technical entries through a separate paginated endpoint: `GET /api/project/:id/technical-entries`.
- [x] Create the `ListProjects` use case.
- [x] List only authenticated user projects.
- [x] Initially implement `name` and `status` filters.
- [x] Implement the `archivedAt` filter.
- [ ] Implement technology filtering as a planned extension.
- [x] Create retrieval and listing endpoints.
- [x] Test use case rules, filters, and user isolation.
- [ ] Expand HTTP coverage for project retrieval and child-resource routes.

### UpdateProject

- [x] Create the `UpdateProject` use case.
- [x] Centralize name, description, status, and local path in the main use case.
- [x] Use optional fields for partial updates and `null` to clear description or local path.
- [x] Reject updates without editable fields.
- [x] Ensure only the owner can change the project.
- [x] Create the update endpoint.
- [x] Test valid updates, description/path, and update attempts by another user.
- [x] Test DTO input validation.

## 6. Project/technical entry relationship

- [x] Allow creating an entry without a project.
- [x] Allow linking an entry to a project owned by the same user.
- [x] Allow changing or clearing the related project during `UpdateTechnicalEntry`.
- [x] Expose related entries through paginated `GET /api/project/:id/technical-entries`.
- [x] Archiving a project changes only the project and does not remove or unlink its entries.
- [ ] Test the full HTTP flow: create project → create entry → link entry → query project entries.

## 7. Issues and solution attempts

### AddSolutionAttempt

- [x] Create the solution attempt entity.
- [x] Create the `AddSolutionAttempt` use case.
- [x] Validate `entryId`, `description`, and `result`.
- [x] Allow attempts only for `ISSUE` entries.
- [x] Accept only `FAILED`, `PARTIAL`, or `SUCCESSFUL`.
- [x] Prevent new attempts on archived entries.
- [x] Ensure the entry belongs to the authenticated user.
- [x] Create the add-attempt endpoint.
- [ ] Test attempts on `ISSUE`, rejection on `LEARNING`, invalid results, and archived entries.

### UpdateSolutionAttempt

- [x] Create the `UpdateSolutionAttempt` use case.
- [x] Allow editing only the description (`description`) of an existing attempt.
- [x] Keep the result/status (`result`) immutable; record a new attempt to change the status.
- [x] Ensure the attempt and technical entry belong to the authenticated user.
- [x] Create authenticated `PATCH /api/technical-entry/:entryId/solution-attempts/:attemptId`.
- [x] Test description updates, result preservation, and user isolation.

### RemoveSolutionAttempt

- [x] Create the `RemoveSolutionAttempt` use case.
- [x] Allow removing an existing solution attempt only by the technical entry owner.
- [x] Create authenticated `DELETE /api/technical-entry/:entryId/solution-attempts/:attemptId`.
- [x] Test removal, missing-attempt removal, and user isolation.

### ListSolutionAttempts

- [x] Create the paginated attempt listing use case.
- [x] Allow filtering attempts by result.
- [x] Ensure the entry belongs to the authenticated user before querying.
- [x] Create `GET /api/technical-entry/:entryId/solution-attempts`.
- [x] Test listing, result filtering, and user isolation.

### ResolveTechnicalIssue

- [x] Create the `ResolveTechnicalIssue` use case.
- [x] Allow resolution only for `ISSUE` entries.
- [x] Require `conclusion`.
- [x] Change status from `OPEN` to `RESOLVED`.
- [x] Record `resolvedAt`.
- [x] Allow resolution without a `SUCCESSFUL` attempt, following the use case.
- [x] Create `PATCH /api/technical-entry/:id/resolve`.
- [x] Test required conclusion, invalid type, status transition, and user isolation.

### ReopenTechnicalIssue

- [x] Create the `ReopenTechnicalIssue` use case.
- [x] Change status from `RESOLVED` to `OPEN`.
- [x] Preserve attempts, the previous conclusion, and required history.
- [x] Create `PATCH /api/technical-entry/:id/reopen`.
- [x] Test reopening and preservation of previous data.

## 8. Project details

### Project Technologies

- [x] Create the project technology entity or relationship.
- [x] Create the `AddProjectTechnology` use case.
- [x] Validate `projectId`, `name`, and `version?` in the domain.
- [x] Ensure the project belongs to the user.
- [x] Prevent the same technology appearing twice in a project.
- [x] Create the `RemoveProjectTechnology` use case.
- [x] Remove a technology without removing tags or technical entries with the same name.
- [x] Create add/remove technology endpoints.
- [x] Test duplicates, authorization, and technology independence.
- [ ] **Post-MVP:** allow updating project technology `name` and `version`.

### Project Commands

- [x] Create the project command entity.
- [x] Create the `AddProjectCommand` use case.
- [x] Create the `SearchProjectCommand` use case.
- [x] Create the `GetProjectCommand` use case.
- [x] Validate `projectId`, `title`, `command`, and `description?`.
- [x] Create the `UpdateProjectCommand` use case.
- [x] Create the `RemoveProjectCommand` use case.
- [x] Ensure project ownership in every operation.
- [x] Create endpoints to add, list, retrieve, update, and remove commands.
- [x] Test the full lifecycle and access attempts by another user.

### Project Resources

- [x] Create the project resource entity.
- [x] Create the `AddProjectResource` use case.
- [x] Create the `SearchProjectResource` use case.
- [x] Create the `GetProjectResource` use case.
- [x] Validate `projectId`, `label`, `url`, and `type?`.
- [x] Validate the resource URL.
- [x] Create the `UpdateProjectResource` use case.
- [x] Create the `RemoveProjectResource` use case.
- [x] Ensure project ownership in every operation.
- [x] Create endpoints to add, list, retrieve, update, and remove resources.
- [x] Test the full lifecycle, invalid URLs, and authorization.

### Project Environments

- [x] Model environment category, normalized names, optional runtime details,
  and project-scoped uniqueness in the domain and PostgreSQL.
- [x] Create, list, update, and remove environments through owned projects.
- [x] Search all owned environments by text, category, and project with sorting
  and pagination.
- [x] Keep environments readable while their project is archived and cascade
  them when the project is permanently deleted.
- [x] Cover domain, use cases, persistence, and the authenticated HTTP seam.

## 9. Archiving

### ArchiveProject and RestoreProject

- [x] Create explicit, idempotent archiving and restoration use cases.
- [x] Archive the project without hard deletion by setting `archivedAt`.
- [x] Define the relationship between `archivedAt` and `ProjectStatus` (`ACTIVE`, `INACTIVE`, or `FINISHED`).
- [x] Prevent operations incompatible with archived projects according to domain rules.
- [x] Preserve related technologies, environments, commands, and resources; entry preservation is covered by the project/entry relationship.
- [x] Create authenticated `PATCH /api/project/:id/archive` and `PATCH /api/project/:id/restore`.
- [x] Test archiving, restoration, and authorization in the use case.
- [x] Test relationship preservation through HTTP.

`archivedAt` is independent of `ProjectStatus`: archiving does not change
`ACTIVE`, `INACTIVE`, or `FINISHED`, and restoration recovers the same status. While
archived, the aggregate is read-only; queries remain available,
but changes to the project, technologies, environments, commands, and resources require
explicit restoration.

### ArchiveTechnicalEntry

- [x] Create the `ArchiveTechnicalEntry` use case.
- [x] Create the `RestoreTechnicalEntry` use case.
- [x] Implement logical entry archiving without hard deletion.
- [x] Implement explicit restoration without changing entry history.
- [x] Define archived entry behavior in lists and detail queries.
- [x] Prevent new solution attempts on archived entries.
- [x] Create authenticated archive and restore endpoints.
- [x] Test archiving, restoration, history preservation, and user isolation.

Listing omits archived entries by default (`archivedAt = null`), while
detail queries still return the entry and its history. The endpoint
`PATCH /api/technical-entry/:id/archive` is authenticated and idempotent.
Restoration is available through the separate idempotent endpoint
`PATCH /api/technical-entry/:id/restore`.

## 10. Suggested incremental delivery

- [x] Deliver the shared foundation; global error standardization and HTTP coverage remain open.
- [x] Deliver registration, login, current user, and logout.
- [x] Deliver technical entry creation, retrieval, listing, and updates.
- [x] Deliver tag creation, listing, and relationships.
- [x] Deliver project creation, retrieval, listing, and updates.
- [x] Deliver project/entry relationships.
- [x] Deliver attempts, resolution, and issue reopening.
- [x] Deliver project technologies, commands, and resources.
- [x] Deliver project and entry archiving.
- [ ] Review API documentation and update regression tests at every stage.

## MVP backend completion criteria

- [x] A user can register, authenticate, view their own account, and sign out.
- [x] An authenticated user can create and retrieve projects.
- [x] An authenticated user can create, update, list, and retrieve technical entries.
- [x] Entries can be linked to projects and tags owned by the same user.
- [ ] Entry listing supports the documented search and filters.
- [x] Issues can record attempts, be resolved, and be reopened.
- [x] No user can access another user's data.
- [ ] Main flows have unit and end-to-end tests.

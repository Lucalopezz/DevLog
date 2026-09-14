# DevLog documentation

This directory collects DevLog decisions, explanations, and implementation plans. It supports both newcomers and readers studying a specific part of the application.

## Where to find answers

Use this table as your starting point. Most questions are addressed in the listed files:

| Question | Recommended file |
| --- | --- |
| What are the product goals, scope, and general decisions? | [`decisions/devlog-decisions.md`](decisions/devlog-decisions.md) |
| How is the database modeled, and why are tables related this way? | [`decisions/database.md`](decisions/database.md) |
| What does the API implement today? | [`usecases/README.md`](usecases/README.md) |
| What does the frontend implement today? | [`../apps/web/README.md`](../apps/web/README.md) |
| Where is the historical/planned MVP specification? | [`usecases/cases.md`](usecases/cases.md) |
| Where are the UML diagrams? | [`diagrams/README.md`](diagrams/README.md) |
| What remains to be implemented in the backend? | [`backlog/backend.md`](backlog/backend.md) |
| What remains to be implemented in the frontend? | [`backlog/frontend.md`](backlog/frontend.md) |
| How do I configure the environment and connect the API to PostgreSQL? | [`guides/configs_workflow.md`](guides/configs_workflow.md) |
| How does authentication work, and how is it implemented? | [`guides/authentication_workflow.md`](guides/authentication_workflow.md) |
| How does entity validation work? | [`guides/entity_validation_workflow.md`](guides/entity_validation_workflow.md) |
| Where are the tests, and how do I run them? | [`guides/testing.md`](guides/testing.md) |
| How are backend modules organized? | [`guides/backend_structure.md`](guides/backend_structure.md) |
| How is the frontend organized? | [`guides/frontend_structure.md`](guides/frontend_structure.md) |
| How is the monorepo structured? | [`guides/monorepo.md`](guides/monorepo.md) |
| Which commands are used frequently? | [`guides/utils.md`](guides/utils.md) |

For setup questions, first read the [root README](../README.md). It contains prerequisites, installation instructions, and the main commands.

## Documentation organization

### `decisions/`

Records product, architecture, and database decisions. Read these files to understand why the project has its current structure.

### `guides/`

Explains technical workflows and step-by-step procedures. Use this directory to understand how a part works or should be implemented.

### `usecases/`

Describes expected system behavior and use case rules. Read these documents before changing feature behavior.

### `backlog/`

Tracks planned implementation and known pending work. Use it to find what still needs to be done.

## Keeping documentation useful

- Before creating a document, check whether an existing file can answer the question.
- Add new documents to the table above and place them in the appropriate directory.
- Distinguish accepted decisions from ideas or future tasks.
- When implementation changes, update the document describing the affected behavior.
- Write all documentation and examples in English, following `AGENTS.md`.

## Suggested reading order

1. Read the [root README](../README.md) to run the project.
2. Read [`decisions/devlog-decisions.md`](decisions/devlog-decisions.md) to understand the product.
3. Read [`usecases/README.md`](usecases/README.md) for implemented rules.
4. Choose a technical guide related to your question.
5. Check [`backlog/backend.md`](backlog/backend.md) before implementing a new task.

The current frontend Projects surface includes project details and a Settings
tab for editing, archiving, restoring, metadata inspection, and confirmed
deletion. The API behavior behind those actions is documented in
[`usecases/projects.md`](usecases/projects.md).

## Current implementation status

As of 2026-09-14, the API MVP functional scope is implemented and has 70 unit
test suites with 343 passing tests. The web application has authentication,
account details, project management, and the first technical-journal slice:
paginated active and archived lists, filters for title/type/status, creation,
detail views, Markdown rendering, content/title editing, and entry lifecycle
actions.

The next implementation focus is the remaining user-facing journal behavior:
project/tag filters, tag assignment, solution attempts, and resolve/reopen
actions. After that, implement editing of project technologies, commands, and
resources, then add frontend behavior tests and the missing API HTTP coverage.

The authoritative task breakdown is kept in [`backlog/backend.md`](backlog/backend.md)
and [`backlog/frontend.md`](backlog/frontend.md).

# DevLog documentation

This directory collects DevLog decisions, explanations, and implementation plans. It supports both newcomers and readers studying a specific part of the application.

## Where to find answers

Use this table as your starting point. Most questions are addressed in the listed files:

| Question                                                              | Recommended file                                                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| What are the product goals, scope, and general decisions?             | [`decisions/devlog-decisions.md`](decisions/devlog-decisions.md)               |
| How is the database modeled, and why are tables related this way?     | [`decisions/database.md`](decisions/database.md)                               |
| What does the API implement today?                                    | [`usecases/README.md`](usecases/README.md)                                     |
| What does the frontend implement today?                               | [`../apps/web/README.md`](../apps/web/README.md)                               |
| How does the app handle a sleeping or unavailable API?                | [`guides/backend-connection.md`](guides/backend-connection.md)                 |
| Where is the historical/planned MVP specification?                    | [`usecases/cases.md`](usecases/cases.md)                                       |
| Where are the API models and frontend flow diagrams?                 | [`diagrams/README.md`](diagrams/README.md)                                     |
| What remains to be implemented in the backend?                        | [`backlog/backend.md`](backlog/backend.md)                                     |
| What remains to be implemented in the frontend?                       | [`backlog/frontend.md`](backlog/frontend.md)                                   |
| How do I configure the environment and connect the API to PostgreSQL? | [`guides/configs_workflow.md`](guides/configs_workflow.md)                     |
| How does authentication work, and how is it implemented?              | [`guides/authentication_workflow.md`](guides/authentication_workflow.md)       |
| How does entity validation work?                                      | [`guides/entity_validation_workflow.md`](guides/entity_validation_workflow.md) |
| Where are the tests, and how do I run them?                           | [`guides/testing.md`](guides/testing.md)                                       |
| How are backend modules organized?                                    | [`guides/backend_structure.md`](guides/backend_structure.md)                   |
| How is the frontend organized?                                        | [`guides/frontend_structure.md`](guides/frontend_structure.md)                 |
| How do profile and password settings work?                            | [`guides/account-settings.md`](guides/account-settings.md)                     |
| How does the activity timeline load and group entries?                | [`guides/activity-timeline.md`](guides/activity-timeline.md)                   |
| How are knowledge totals and issue composition calculated?            | [`guides/knowledge-overview.md`](guides/knowledge-overview.md)                 |
| How do project environments work?                                     | [`guides/project-environments-plan.md`](guides/project-environments-plan.md)   |
| How is the monorepo structured?                                       | [`guides/monorepo.md`](guides/monorepo.md)                                     |
| Which project skills guide coding-agent work?                         | [`../AGENTS.md#project-skills`](../AGENTS.md#project-skills)                    |
| Which commands are used frequently?                                   | [`guides/utils.md`](guides/utils.md)                                           |

For setup questions, first read the [root README](../README.md). It contains prerequisites, installation instructions, and the main commands.

## Documentation organization

### `decisions/`

Records product, architecture, and database decisions. Read these files to understand why the project has its current structure.

### `guides/`

Explains technical workflows and step-by-step procedures. Use this directory to understand how a part works or should be implemented.

### `diagrams/`

Contains versioned API models and frontend flow diagrams. Each frontend diagram
links to its implementation guide and the source files it describes.

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

The project and technical-journal workflows shipped for MVP 1.0 are complete
in the frontend. Project screens aggregate technologies, environments, entries,
commands, and resources; the journal supports tags, solution attempts, and issue
resolution. See the [web application guide](../apps/web/README.md) for the
current screens and [`usecases/`](usecases/) for API behavior.

## Current implementation status

MVP 1.0 is complete for the project and technical-journal workflows. These
follow-up frontend areas are also implemented in the current working tree:

- Account settings at `/settings` for profile name and password updates;
  `/account` remains a read-only profile view, and email cannot be edited.
- Activity Timeline at `/activity-timeline`, grouping active journal entries
  by local creation day with project/type filters and incremental loading.
- Knowledge Overview at `/knowledge-overview`, showing current journal totals,
  issue composition, and recent learnings/resolutions under a shared project scope.

The authoritative task breakdown is kept in [`backlog/backend.md`](backlog/backend.md)
and [`backlog/frontend.md`](backlog/frontend.md). The backend use cases for
profile updates and password changes are documented in
[`usecases/account-and-tags.md`](usecases/account-and-tags.md).

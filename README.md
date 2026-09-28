# DevLog

DevLog is a personal application for recording technical knowledge gained while developing projects.

It combines a technical journal with a project dashboard. Use it to document issues, solution attempts, lessons learned, technologies, important commands, and useful links for each project.

## Release status

The MVP 1.0 workflows for projects and the technical journal are complete in
the API and web application. The current frontend also implements account
settings, Activity Timeline, and Knowledge Overview; see
[`docs/backlog/frontend.md`](docs/backlog/frontend.md).

## Current capabilities

- User registration, login, logout, profile viewing, and name/password updates;
- Project creation, listing, filtering, editing, and lifecycle management;
- Project detail views that aggregate technologies, technical entries,
  commands, resources, and environments, with create/edit/remove workflows for
  project data;
- Project settings for metadata and local path, archive/restore actions, and
  protected permanent deletion;
- Technical entries for issues (`ISSUE`) and lessons learned (`LEARNING`);
- Paginated active and archived technical journals with title, type, status, and
  tag filters, Markdown rendering, creation, editing, and entry detail pages;
- Tag assignment and removal, solution-attempt management, and issue
  resolve/reopen workflows in the web application;
- Technical entry archiving, restoration, and confirmed deletion;
- Quick Capture from the sidebar, using the regular technical-entry flow;
- Dedicated tag, technology, and environment pages;
- Activity Timeline with active entries grouped by local creation day, project
  and type filters, and incremental loading;
- Knowledge Overview with journal totals, current issue composition, recent
  learnings and resolutions, and project-scoped links to the journal;
- Ownership checks that restrict authenticated users to their own data.

The account page displays the signed-in user's name and email. The settings
page lets the user update their name and change their password. Email remains
read-only under the current API contract.

Timeline and overview summarize the current, unarchived journal. They do not
store a permanent history of edits or lifecycle actions.

## Technologies

- Monorepo with pnpm Workspaces and Turborepo;
- NestJS, Prisma, and PostgreSQL backend;
- React, Vite, and TypeScript frontend;
- Database running in Docker.

## Structure

```text
apps/
  api/      # NestJS API
  web/      # React interface
docker/     # PostgreSQL configuration
docs/       # Project decisions and guides
```

## Available frontend routes

The web application currently exposes:

| Route | Purpose |
| --- | --- |
| `/` | Public introduction to DevLog; no authentication required |
| `/dashboard` | Authenticated workspace overview with recent projects and entries |
| `/account` | Authenticated account details |
| `/settings` | Update the profile name and change the password |
| `/activity-timeline` | Active journal entries grouped by local creation day |
| `/knowledge-overview` | Journal totals, issue composition, and recent knowledge |
| `/projects` | Paginated project list with search, filters, and creation |
| `/projects/:projectId` | Project overview, entries, technologies, environments, commands, resources, and settings |
| `/technical-entries` | Paginated active technical journal with search, filters, and optional `projectId` URL scope |
| `/technical-entries/:technicalEntryId` | Technical entry details, content editing, and lifecycle actions |
| `/technical-entries/archived` | Paginated archived technical entries |
| `/tags` | Search and manage tags |
| `/technologies` | Search technologies recorded on projects |
| `/environments` | Search and filter environments across owned projects |

The project settings area supports editing, archiving, restoring, and
permanently deleting an unarchived project after confirmation.
Quick Capture is available as a sidebar action rather than a separate route.

## Getting started

Prerequisites: Node.js, pnpm 11.21.0, and Docker.

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create a root `.env` file with PostgreSQL credentials, for example:

   ```env
   POSTGRES_DB=devlog
   POSTGRES_USER=devlog
   POSTGRES_PASSWORD=devlog
   POSTGRES_PORT=5432
   ```

3. Start the database:

   ```bash
   pnpm db:up
   ```

4. Run the applications in development mode:

   ```bash
   pnpm dev
   ```

You can also run them separately with `pnpm --filter api dev` and `pnpm --filter web dev`.

The API is served at `http://localhost:3000/api` and Vite usually serves the
frontend at `http://localhost:5173`.

## Useful commands

```bash
pnpm build                        # Build the projects
pnpm lint                         # Run lint checks
pnpm test                         # Run available tests
pnpm --filter api test:integration # Run API integration tests against the test database
pnpm --filter api test:e2e         # Run API HTTP end-to-end tests
pnpm db:down                      # Stop the database
pnpm db:logs                      # View database logs
```

## Documentation

Documentation is organized by type, with an index to help you find answers:

- [`docs/README.md`](docs/README.md): documentation entry point, mapping questions to relevant files;
- [`docs/decisions/`](docs/decisions/): product, architecture, and database decisions;
- [`docs/guides/`](docs/guides/): technical explanations and workflows;
- [`docs/usecases/`](docs/usecases/): expected behavior and system rules;
- [`docs/backlog/`](docs/backlog/): tasks and known pending work.

If you are new to the project, start with [`docs/README.md`](docs/README.md) after reading the setup instructions above.

English is the standard language for the application, documentation, API messages, and code comments. See [`AGENTS.md`](AGENTS.md) for repository guidelines.

## After MVP 1.0

Account settings, Activity Timeline, and Knowledge Overview are implemented in
the current working tree. Their status and scope are tracked in
[`docs/backlog/frontend.md`](docs/backlog/frontend.md).

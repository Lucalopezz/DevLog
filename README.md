# DevLog

DevLog is a personal application for recording technical knowledge gained while developing projects.

It combines a technical journal with a project dashboard. Use it to document issues, solution attempts, lessons learned, technologies, important commands, and useful links for each project.

## Release status

The MVP 1.0 workflows for projects and the technical journal are complete in
the API and web application. The remaining frontend roadmap is account data
management, project environments, an activity timeline, and a knowledge
overview; see [`docs/backlog/frontend.md`](docs/backlog/frontend.md).

## Current capabilities

- User registration, login, logout, and profile viewing;
- Project creation, listing, filtering, editing, and lifecycle management;
- Project detail views that aggregate technologies, technical entries,
  commands, and resources, with create/edit/remove workflows for project data;
- Project settings for metadata and local path, archive/restore actions, and
  protected permanent deletion;
- Technical entries for issues (`ISSUE`) and lessons learned (`LEARNING`);
- Paginated active and archived technical journals with title, type, status, and
  tag filters, Markdown rendering, creation, editing, and entry detail pages;
- Tag assignment and removal, solution-attempt management, and issue
  resolve/reopen workflows in the web application;
- Technical entry archiving, restoration, and confirmed deletion;
- Quick Capture from the sidebar, using the regular technical-entry flow;
- Dedicated tag and technology pages;
- Ownership checks that restrict authenticated users to their own data.

The account page currently displays the signed-in user's name and email.
Profile updates and password changes are API capabilities but do not yet have
frontend management flows. The email is immutable under the current API
contract.

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

The authenticated web application currently exposes:

| Route | Purpose |
| --- | --- |
| `/` | Workspace overview with recent projects and entries |
| `/account` | Authenticated account details |
| `/projects` | Paginated project list with search, filters, and creation |
| `/projects/:projectId` | Project overview, entries, commands, resources, and settings |
| `/technical-entries` | Paginated active technical journal with search and filters |
| `/technical-entries/:technicalEntryId` | Technical entry details, content editing, and lifecycle actions |
| `/technical-entries/archived` | Paginated archived technical entries |
| `/tags` | Search and manage tags |
| `/technologies` | Search technologies recorded on projects |

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

## Planned after MVP 1.0

The next frontend areas are account data management, a project environments
listing, an activity timeline, and a knowledge overview. The roadmap is
tracked in [`docs/backlog/frontend.md`](docs/backlog/frontend.md).

# DevLog

DevLog is a personal application for recording technical knowledge gained while developing projects.

It combines a technical journal with a project dashboard. Use it to document issues, solution attempts, lessons learned, technologies, important commands, and useful links for each project.

## Current capabilities

- User registration, login, logout, and account management;
- Project creation, listing, filtering, editing, and detailed views;
- Project lifecycle management through archiving and restoration;
- Project settings with metadata, local path, lifecycle actions, and a protected
  delete flow;
- Technical entries for issues (`ISSUE`) and lessons learned (`LEARNING`);
- Solution attempts, resolution status, entry archiving, and tags in the API;
- Technologies, commands, and resources linked to projects in the API;
- Ownership checks that restrict authenticated users to their own data.

The frontend currently prioritizes the authentication and Projects experience.
Technical entry creation and editing are part of the API but their complete
frontend workflow is still being developed.

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
| `/` | Frontend foundation and setup screen |
| `/account` | Authenticated account details |
| `/projects` | Paginated project list with search, filters, and creation |
| `/projects/:projectId` | Project overview, entries, commands, resources, and settings |

The project settings area supports editing, archiving, restoring, copying
metadata, and permanently deleting an unarchived project after confirmation.

## Getting started

Prerequisites: Node.js, pnpm 11.18.0, and Docker.

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

## Next areas to develop

- Complete technical entry creation and editing in the frontend;
- Add frontend workflows for tags and solution attempts;
- Add create, edit, and delete flows for project technologies, commands, and resources;
- Add a frontend test runner and broader HTTP end-to-end coverage.

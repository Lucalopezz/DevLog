# DevLog

DevLog is a personal application for recording technical knowledge gained while developing projects.

It combines a technical journal with a project dashboard. Use it to document issues, solution attempts, lessons learned, technologies, important commands, and useful links for each project.

## Planned features

- User registration, login, and logout;
- Project creation and organization;
- Technical entries for issues (`ISSUE`) and lessons learned (`LEARNING`);
- Solution attempts, resolution status, and entry archiving;
- Tags, search, and filters;
- Technologies, commands, and resources linked to projects.

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

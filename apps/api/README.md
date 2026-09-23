# DevLog API

DevLog backend. The API turns the technical journal into persisted resources organized by user and project: entries about issues and lessons learned, solution attempts, tags, technologies, commands, and useful links.

## Current state

The API includes modules for:

- JWT authentication through an `httpOnly` cookie;
- Registration and editing of the authenticated user;
- Projects, including status, editing, archiving, restoration, and deletion;
- `ISSUE` and `LEARNING` technical entries;
- Solution attempts and issue resolution/reopening;
- Tags associated with entries;
- Technologies, commands, and resources linked to projects.

All routes except user registration and the authentication flow require an authenticated user. The global API prefix is `/api`.

## Technologies and responsibilities

- **NestJS** organizes the application into modules and exposes HTTP controllers.
- **Prisma** maps the domain to PostgreSQL and versions the database through migrations.
- **PostgreSQL** stores users, projects, and technical entries.
- **Jest** covers unit rules, database integration, and HTTP flows.
- The **session cookie** carries the JWT. Clients must send credentials in cross-origin requests.

## Code organization

Each resource has its own boundary in `src/`:

```text
src/
  auth/              # Login, logout, guard, and authenticated user
  user/              # Registration and profile
  project/           # Projects and supporting resources
  technical-entry/   # Entries, tags, and solution attempts
  tag/               # User tag catalog
  shared/            # Database, configuration, pipes, filters, and presenters
  app.module.ts      # Module composition
  main.ts            # Bootstrap and global configuration
```

Within features, the main layers are:

- `domain/`: entities, rules, and domain contracts;
- `application/`: use cases and input/output DTOs;
- `infrastructure/`: controllers, modules, Prisma repositories, and presenters.

Use cases receive `userId` from `AuthGuard`, never from the client request body.
Queries and mutations validate resource ownership to prevent access to another
user's data. The project aggregate also enforces that archived projects are
read-only, project names are unique per user during creation, and deletion is
allowed only after restoration. See the
[project use cases](../docs/usecases/projects.md) and [database decisions](../docs/decisions/database.md)
for the reasoning.

## Local configuration

Install dependencies and start PostgreSQL from the monorepo root:

```bash
pnpm install
cp .env.example .env
pnpm db:up
```

Configure API variables in `apps/api/.env`:

```bash
cp apps/api/.env.example apps/api/.env
```

The file should include at least:

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port; defaults to `3000` |
| `NODE_ENV` | Environment, usually `development` |
| `DATABASE_URL` | PostgreSQL connection URL |
| `JWT_SECRET` | Secret used to sign tokens |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins |

After the first installation, generate Prisma Client and apply migrations:

```bash
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma migrate deploy
```

To replace the projects, entries, tags, and related records for the existing
`teste@teste.com` account with fictional developer-focused examples, run this
from the monorepo root:

```bash
pnpm --filter api db:seed:demo -- --confirm-email=teste@teste.com
```

The command keeps the account and its credentials, and refuses to run unless
`NODE_ENV=development`, the database host is local, and the exact email flag is
provided. Make sure `apps/api/.env` points to the local development database.

The configuration service reads `JWT_EXPIRES_IN_SECONDS` for JWT lifetime. Example files still use the legacy `JWT_EXPIRES_IN` name; to change the lifetime, use the name read by the service or align the examples in a future change.

## Running

With the database available:

```bash
# API only, with automatic reload
pnpm --filter api dev

# All monorepo apps
pnpm dev
```

By default, the API is available at `http://localhost:3000/api`.

## Main route groups

Controllers are the source of truth for payload and pagination details. This overview helps locate each use case entry point:

| Group | Examples | Access |
| --- | --- | --- |
| Auth | `POST /api/auth/login`, `POST /api/auth/logout` | Login/logout |
| Users | `POST /api/users`, `GET /api/users/me` | Registration / authenticated |
| Projects | `GET`, `POST`, `PATCH`, and `DELETE /api/project/...` | Authenticated |
| Entries | `GET`, `POST`, `PATCH`, and `DELETE /api/technical-entry/...` | Authenticated |
| Tags | `GET`, `POST`, and `DELETE /api/tag/...` | Authenticated |

Projects also expose subresources for technical entries, technologies,
commands, and resources. Project lifecycle endpoints are:

| Operation | Endpoint |
| --- | --- |
| Archive | `PATCH /api/project/:id/archive` |
| Restore | `PATCH /api/project/:id/restore` |
| Delete | `DELETE /api/project/:id` |

Entries expose tags and solution attempts. Deleting a project cascades to its
technologies, commands, and resources; associated technical entries remain and
are unlinked from the deleted project.

## Tests and quality

```bash
pnpm --filter api lint
pnpm --filter api test
pnpm --filter api test:cov
```

Integration and end-to-end tests use a separate PostgreSQL instance. Start it before testing and stop it afterward:

```bash
pnpm --filter api db:test:up
pnpm --filter api test:integration
pnpm --filter api test:e2e
pnpm --filter api db:test:down
```

The test database uses `apps/api/.env.test` and defaults to port `5433`. `db:test:reset` deletes its data; use it only when that cleanup is intentional.

## Migrations

The schema lives in [`prisma/schema.prisma`](prisma/schema.prisma), and versioned changes live in [`prisma/migrations`](prisma/migrations). During development, change the schema carefully and record a migration before sharing the change with the team.

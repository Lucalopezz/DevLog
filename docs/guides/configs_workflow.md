# Configuration and database connection workflow

This document explains how PostgreSQL, Docker, Prisma, and the NestJS API relate in DevLog.

## Overview

The workflow can be represented as follows:

```text
Root .env
   ↓
Docker Compose
   ↓
PostgreSQL in the container
   ↓
localhost:5432
   ↑
DATABASE_URL in apps/api/.env
   ↑
Prisma CLI / future PrismaService
```

The application has three different responsibilities:

1. Docker starts and configures the PostgreSQL server.
2. Prisma CLI runs migrations and generates Prisma Client.
3. The API uses Prisma Client to execute queries at runtime.

At the stage described by this guide, the database and Prisma CLI were configured, but the API did not yet register a `PrismaService` or execute queries.

## 1. Root `.env`

The root `.env` contains variables used by Docker Compose:

```env
POSTGRES_DB=devlog
POSTGRES_USER=devlog
POSTGRES_PASSWORD=devlog
POSTGRES_PORT=5432
```

The `db:up` script in [`package.json`](../../package.json) tells Docker Compose to use this file:

```json
"db:up": "docker compose --env-file .env -f docker/compose.yaml up -d database"
```

[`docker/compose.yaml`](../../docker/compose.yaml) uses these variables to configure the container:

```yaml
environment:
  POSTGRES_DB: ${POSTGRES_DB}
  POSTGRES_USER: ${POSTGRES_USER}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

These variables answer the question:

> Which database name, user, and password should PostgreSQL start with?

### Port mapping

Compose defines this mapping:

```yaml
ports:
  - "${POSTGRES_PORT}:5432"
```

This means:

```text
Computer port 5432 → container port 5432
```

When the API runs locally on the computer, it can therefore reach the database at `localhost:5432`.

## 2. `apps/api/.env`

The API has another environment file at [`apps/api/.env`](../../apps/api/.env.example). The actual `.env` must not be versioned.

The example contains:

```env
DATABASE_URL=postgresql://devlog:devlog@localhost:5432/devlog
PORT=3000
```

`DATABASE_URL` combines the information needed to locate the database:

```text
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

In this project:

```text
postgresql://devlog:devlog@localhost:5432/devlog
                  │       │       │        │
                user    password host     database
```

Since Node runs the API locally and only PostgreSQL runs in Docker, the connection path is:

```text
Local API → localhost:5432 → PostgreSQL in Docker
```

## 3. Why two configurations?

The two files have different consumers.

Docker uses the separate root variables:

```env
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_PORT
```

Prisma and the PostgreSQL driver use the URL:

```env
DATABASE_URL=postgresql://...
```

The configurations represent the same data in different formats:

```text
Docker:
POSTGRES_USER=devlog
POSTGRES_PASSWORD=devlog
POSTGRES_DB=devlog

Prisma:
DATABASE_URL=postgresql://devlog:devlog@localhost:5432/devlog
```

In this project, Docker uses `POSTGRES_*` variables, while Prisma uses `DATABASE_URL`.

## 4. Who uses `DATABASE_URL`?

[`apps/api/prisma.config.ts`](../../apps/api/prisma.config.ts) loads environment variables:

```ts
import 'dotenv/config';
```

It then supplies the URL to Prisma configuration:

```ts
datasource: {
  url: process.env['DATABASE_URL'],
}
```

Commands such as these use the configuration:

```bash
pnpm --filter api exec prisma migrate dev --name init
pnpm --filter api exec prisma generate
```

Prisma CLI uses `DATABASE_URL` for:

- Checking the database connection;
- Running migrations;
- Comparing the schema with the database;
- Performing introspection when needed;
- Generating Prisma Client.

## 5. The role of `schema.prisma`

[`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma) describes the database model for Prisma.

For example:

```prisma
model User {
  id    String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name  String @db.VarChar(120)
  email String @unique @db.VarChar(255)
}
```

This file is not itself a database connection. It describes:

- Tables;
- Columns;
- Types;
- Relationships;
- Indexes;
- Default values;
- Unique constraints.

Prisma uses this description to generate:

1. SQL migrations in `apps/api/prisma/migrations`;
2. TypeScript types;
3. Prisma Client query methods.

In Prisma 7, the connection URL belongs in [`prisma.config.ts`](../../apps/api/prisma.config.ts), rather than directly in the `schema.prisma` datasource block.

## 6. Was the API already connected to the database?

Not yet at the stage described here.

Although the project already had:

- `@prisma/client`;
- `@prisma/adapter-pg`;
- The Prisma schema;
- migrations;
- The generated client;

[`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts) was still empty:

```ts
@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

There was also no service instantiating Prisma Client or code making calls such as:

```ts
prisma.user.findMany()
prisma.project.create()
```

The state at that stage was therefore:

```text
PostgreSQL is running
Prisma CLI knows the database
The API does not query it yet
```

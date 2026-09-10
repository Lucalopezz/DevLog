# Creating the monorepo

This document records the initial DevLog monorepo setup, including:

- NestJS backend;
- React frontend with Vite;
- pnpm package management;
- Workspace organization with pnpm Workspaces;
- Application execution through Turborepo.

## Initial structure

The adopted project structure is:

```text
devlog/
├── apps/
│   ├── api/
│   └── web/
├── packages/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

Responsibilities:

```text
apps/api     → Backend NestJS
apps/web     → React frontend with Vite
packages     → Pacotes compartilhados futuros
```

The `packages` directory may initially remain empty. Create shared packages only when there is a real need.

---

## 1. Create the project root

```bash
mkdir DevLog
cd DevLog
git init
pnpm init
```

The root represents the monorepo, not an executable Node application.

The root `package.json` should use a lowercase name and `"private": true` to avoid accidental npm publication.

Example:

```json
{
  "name": "devlog",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test"
  },
  "devDependencies": {
    "turbo": "latest"
  },
  "packageManager": "pnpm@11.18.0"
}
```

`packageManager` requires a complete semantic version:

```text
pnpm@11.18.0
```

Incomplete values, such as:

```text
pnpm@10
```

are invalid.

There is no need to keep both `packageManager` and `devEngines.packageManager`.

If a block like this exists:

```json
{
  "devEngines": {
    "packageManager": {
      "name": "pnpm",
      "version": "pnpm@11.18.0"
    }
  }
}
```

it can be removed.

Besides duplicating configuration, its `version` value would be incorrect; this field requires only:

```text
11.18.0
```

This project keeps only the traditional field:

```json
{
  "packageManager": "pnpm@11.18.0"
}
```

---

## 2. Install Turborepo

From the project root:

```bash
pnpm add -D turbo
```

Turborepo coordinates commands such as:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
```

It does not replace pnpm Workspaces.

Their responsibilities differ:

```text
pnpm Workspaces → organizes projects and dependencies
Turborepo       → runs and coordinates tasks
```

---

## 3. Configure the workspace

Create `pnpm-workspace.yaml` at the root:

```yaml
packages:
  - apps/*
  - packages/*
```

Then create the main directories:

```bash
mkdir -p apps packages
```

pnpm recognizes each directory containing a `package.json` under these paths as part of the workspace.

---

## 4. Create the NestJS backend

Run from the monorepo root:

```bash
pnpm dlx @nestjs/cli new apps/api \
  --package-manager pnpm \
  --skip-git
```

`--skip-git` prevents NestJS from creating another Git repository inside `apps/api`.

Git should exist only at the monorepo root.

The generated structure looks like:

```text
apps/api/
├── src/
├── test/
├── package.json
├── nest-cli.json
├── tsconfig.json
└── tsconfig.build.json
```

### Possible installation failure

Nest CLI can generate all files correctly but fail during automatic dependency installation.

Example:

```text
Packages installation failed
```

In that case, do not recreate the scaffold. Fix pnpm configuration and install manually from the root:

```bash
pnpm install --strict-peer-dependencies=false
```

Since `apps/api` belongs to the workspace, prefer installing from the monorepo root.

---

## 5. Approve pnpm build scripts

During installation, pnpm may block build scripts from some dependencies.

Example:

```text
ERR_PNPM_IGNORED_BUILDS
Ignored build scripts: unrs-resolver
```

To review blocked dependencies:

```bash
pnpm approve-builds
```

In the interactive interface:

```text
Space → select the package
Enter → confirm
```

If the package is not selected, pnpm may record:

```yaml
allowBuilds:
  unrs-resolver: false
```

This means script execution was denied.

Since `unrs-resolver` came from the dependency tree of tools installed by the official scaffold, it may be authorized:

```yaml
packages:
  - apps/*
  - packages/*

allowBuilds:
  unrs-resolver: true
```

After the change:

```bash
pnpm install
```

To check for remaining blocked scripts:

```bash
pnpm ignored-builds
```

---

## 6. Standardize API scripts

NestJS usually creates this script:

```json
{
  "scripts": {
    "start:dev": "nest start --watch"
  }
}
```

Turborepo runs the task named `dev`. Add a script with that name to `apps/api/package.json`.

Example:

```json
{
  "name": "api",
  "scripts": {
    "dev": "nest start --watch",
    "start:dev": "nest start --watch",
    "build": "nest build",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "test": "jest"
  }
}
```

`start:dev` can remain. The `dev` script provides a consistent monorepo convention.

To start only the API:

```bash
pnpm --filter api dev
```

You can also filter by path:

```bash
pnpm --filter ./apps/api dev
```

Or run directly inside the directory:

```bash
cd apps/api
pnpm dev
```

By default, the API is available at:

```text
http://localhost:3000
```

---

## 7. Create the React frontend with Vite

From the monorepo root:

```bash
pnpm create vite apps/web --template react-ts
```

Then:

```bash
pnpm install
```

The structure looks like:

```text
apps/web/
├── public/
├── src/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

Vite already creates this script:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

The package name can be changed to:

```json
{
  "name": "web"
}
```

To start only the frontend:

```bash
pnpm --filter web dev
```

By default, Vite uses:

```text
http://localhost:5173
```

---

## 8. Configure Turborepo

Create `turbo.json` at the root:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "outputs": ["coverage/**"]
    }
  }
}
```

`dev` does not use caching and stays active because development servers continue running.

`build` treats `dist` directories as outputs.

Both NestJS and Vite produce builds in these directories.

---

## 9. Run the monorepo

Once `apps/api` and `apps/web` have scripts named `dev`, run from the root:

```bash
pnpm dev
```

Turborepo starts both applications:

```text
api → nest start --watch
web → vite
```

You can also run each application separately:

```bash
pnpm --filter api dev
```

```bash
pnpm --filter web dev
```

---

## 10. Frontend/backend communication

During development:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:3000
```

The frontend can define an environment variable:

```env
VITE_API_URL=http://localhost:3000
```

Example request:

```ts
const apiUrl = import.meta.env.VITE_API_URL;

const response = await fetch(`${apiUrl}/entries`, {
  credentials: "include",
});
```

Using:

```ts
credentials: "include";
```

is necessary to send and receive cookies between frontend and backend.

In NestJS, CORS must allow the frontend origin and credentials:

```ts
app.enableCors({
  origin: "http://localhost:5173",
  credentials: true,
});
```

---

## 11. Future reverse proxy structure

For local deployment, frontend and backend will share a domain:

```text
http://devlog.local
```

The structure is:

```text
Browser
   |
Caddy or Nginx
   |
   ├── /     → React
   └── /api  → NestJS
```

The frontend can then access the API using:

```ts
fetch("/api/entries", {
  credentials: "include",
});
```

This configuration simplifies cookie usage and avoids some CORS-related issues.

---

## 12. Internal API structure

Domain architecture belongs inside the backend, not at the monorepo root.

Example:

```text
apps/api/src/
├── modules/
│   ├── auth/
│   ├── projects/
│   ├── entries/
│   └── tags/
├── shared/
└── main.ts
```

Each module can be divided into:

```text
entries/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── errors/
├── application/
│   ├── use-cases/
│   └── dto/
└── infrastructure/
    ├── database/
    └── http/
```

Do not share domain entities directly with the frontend.

For example, an entity such as:

```ts
class TechnicalEntry {
  resolve() {}

  reopen() {}
}
```

belongs only to the backend.

In the future, API contracts may be generated from OpenAPI for frontend use.

---

## Expected result

After initial setup, the structure should look like:

```text
devlog/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   ├── test/
│   │   └── package.json
│   └── web/
│       ├── src/
│       ├── public/
│       └── package.json
├── packages/
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

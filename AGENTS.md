# Repository Guidelines

## Project Structure & Module Organization

DevLog is a pnpm/Turborepo monorepo. Application code lives in `apps/`: `apps/api` is the NestJS backend, with source in `src/` and end-to-end tests in `test/`; `apps/web` is the React + Vite frontend, with code in `src/` and static files in `public/`. Reserve `packages/` for genuinely shared workspace packages. Infrastructure is in `docker/`, while project decisions and setup notes live in `docs/`.

## Learning-Focused Development

Remember that this is a study project. My main goal is not only to get the code working, but to understand the reasoning behind the implementation.

Whenever you make changes to the codebase:

- Explain each relevant decision you made.
- Explain why you chose that approach over reasonable alternatives.
- Point out important architectural, design, or implementation concepts involved.
- Explain any trade-offs introduced by the change.
- Avoid making significant changes without explaining their purpose.
- When appropriate, mention what I should study or understand to better grasp the solution.

Prefer teaching and explaining over simply providing a finished implementation.

The goal is for me to learn as much as possible from every change.

### Didactic Code Comments

When implementing code, add concise comments in the places where the logic may
not be obvious to someone learning the subject. Comments should explain the
reasoning and the flow, not merely repeat what the code already says.

In particular, make the following explicit when they are relevant:

- How hooks cooperate and what responsibility each hook has.
- How data flows through forms, schemas, resolvers, mutations, and API calls.
- Why a design or implementation approach was chosen over reasonable alternatives.
- How asynchronous states such as loading, success, and error are handled.
- Important accessibility, architectural, or TypeScript concepts involved.
- Trade-offs, limitations, and topics that are worth studying further.

Prefer comments close to the code they explain, using examples or short
step-by-step explanations when that improves understanding. Avoid excessive
comments on self-explanatory lines and avoid comments that can become stale;
keep the implementation readable enough that comments complement the code
instead of replacing it.

## Build, Test, and Development Commands

Run commands from the repository root using pnpm 11.18.0.

- `pnpm dev` starts all available development tasks through Turborepo.
- `pnpm build`, `pnpm lint`, and `pnpm test` build, lint, or test workspace packages that implement those tasks.
- `pnpm --filter api dev` runs the Nest API in watch mode; `pnpm --filter web dev` starts Vite.
- `pnpm --filter api test:e2e` runs API end-to-end tests; `pnpm --filter api test:cov` produces coverage.
- `pnpm db:up` starts the Docker database using root `.env`; use `pnpm db:down` to stop it and `pnpm db:logs` to follow its logs. Do not run `pnpm db:reset` unless intentionally removing database volumes.

## Coding Style & Naming Conventions

Write TypeScript throughout. Follow the nearest ESLint configuration: `apps/api` uses ESLint with Prettier, while `apps/web` uses ESLint with React Hooks and React Refresh rules. Format API TypeScript with `pnpm --filter api format`; let Prettier determine spacing and line endings. Use PascalCase for React components, Nest classes, and interfaces; camelCase for functions and variables; and kebab-case filenames such as `user-profile.tsx`. Keep Nest modules, controllers, and services grouped by feature under `apps/api/src/`.

For components from the shadcn/ui library, always use the shadcn CLI command to
add or update them instead of writing the component file manually. If the CLI
cannot be executed or does not support the required change, stop and ask the
user to run the command before continuing. Custom composition around a
generated component is allowed, but the library primitive itself must come
from the CLI.

For frontend styling, prefer the Tailwind spacing and sizing scale over arbitrary values when an equivalent utility exists (for example, use `size-128` instead of `size-[32rem]`). Use `rem` for custom CSS dimensions and arbitrary Tailwind values; do not introduce CSS dimensions in `px`. Remember that utility names such as `px-6` represent horizontal padding tokens and are not pixel units.

## Testing Guidelines

API unit tests use Jest and belong beside source as `*.spec.ts`. End-to-end tests belong in `apps/api/test/` and use the `*.e2e-spec.ts` convention with Supertest. Add tests for new backend behavior and run the smallest relevant test command before submitting. The web app has no test runner configured yet; at minimum run its lint and build commands after frontend changes.

## Commit & Pull Request Guidelines

Use concise Conventional Commit-style subjects, as in `feat(api): remove unnecessary configs` or `feat(docker): create docker configuration`. Prefer a type and optional scope: `feat(web): add entry form`, `fix(api): validate payload`. Keep commits focused. Pull requests should explain the user-visible or architectural change, link relevant issues, list validation performed, and include screenshots for UI changes. Never commit `.env` files or credentials; update `.env.example` when configuration requirements change.

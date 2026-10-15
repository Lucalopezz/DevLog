# Repository Guidelines

## Project Structure & Module Organization

DevLog is a pnpm/Turborepo monorepo. Application code lives in `apps/`: `apps/api` is the NestJS backend, with source in `src/` and end-to-end tests in `test/`; `apps/web` is the React + Vite frontend, with code in `src/` and static files in `public/`. Reserve `packages/` for genuinely shared workspace packages. Infrastructure is in `docker/`, while project decisions and setup notes live in `docs/`.

## Project Skills

Project-specific skills are versioned in `.agents/skills/`. Read and apply only
the skills relevant to the task; their linked guides and current source provide
the detailed context.

- Before creating or moving a repository file, read and apply
  [devlog-structure](.agents/skills/devlog-structure/SKILL.md) to choose its owner,
  location, and dependency boundaries.
- During planning and implementation of requested changes, apply
  [devlog-suggestions](.agents/skills/devlog-suggestions/SKILL.md) to surface useful
  options and newly discovered questions. Invite user input on consequential
  choices while continuing independent work. Do not manufacture questions for
  routine details or repeat requests for already settled decisions.
- Select the specialist skills below when the work matches their scope. Skills
  supplement these guidelines and reference maintained documentation rather than
  replacing it. Keep the learning-focused explanations required below.

| Skill | When to apply |
| --- | --- |
| [devlog-structure](.agents/skills/devlog-structure/SKILL.md) | Creating or moving files, features, tests, or shared code. |
| [devlog-backend-domain](.agents/skills/devlog-backend-domain/SKILL.md) | Implementing domain rules, use cases, and backend boundaries. |
| [devlog-ui-design](.agents/skills/devlog-ui-design/SKILL.md) | Creating or changing screens, components, and interactions. |
| [devlog-frontend-data-flow](.agents/skills/devlog-frontend-data-flow/SKILL.md) | Connecting forms, API calls, queries, mutations, and URL state. |
| [devlog-testing](.agents/skills/devlog-testing/SKILL.md) | Choosing tests and validation for changed behavior. |
| [devlog-database](.agents/skills/devlog-database/SKILL.md) | Changing Prisma models, migrations, or persistence behavior. |
| [devlog-auth-ownership](.agents/skills/devlog-auth-ownership/SKILL.md) | Changing authentication, sessions, or access to owned resources. |
| [devlog-documentation](.agents/skills/devlog-documentation/SKILL.md) | Updating behavior, contract, architecture, or setup documentation. |
| [devlog-architecture-review](.agents/skills/devlog-architecture-review/SKILL.md) | Reviewing feature or refactor architecture when requested. |
| [devlog-suggestions](.agents/skills/devlog-suggestions/SKILL.md) | Discussing useful options and questions throughout requested work. |

## Language Standard

English is the standard language for the application and all repository content.
Write all UI text (including accessibility labels), API responses and validation
messages, documentation and READMEs, diagrams, code comments, test descriptions,
and example data in English. Use English for new file names and identifiers, and
use the `en-US` locale for application date and number formatting. Preserve
user-provided content and external API identifiers as supplied.

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

Run commands from the repository root using pnpm 11.21.0.

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

Follow test-driven development (TDD) for behavior changes: write the test first,
run it and confirm that it fails for the intended reason (Red), implement the
smallest change that makes it pass (Green), then refactor while keeping the tests
green. Do not implement a feature or bug fix before its test. When expanding
coverage of existing behavior, write the characterization test first and check
that its assertions detect a relevant defect; existing correct behavior may
already make it pass.

Every bug fix must include a regression test in the same focused change. First
reproduce the bug with a failing test, then verify that the fix makes it pass.
Choose the smallest test layer that can reproduce the bug with the necessary
real collaborators; add integration or end-to-end coverage when an isolated unit
test cannot protect the failing flow.

Always preserve the existing frontend and backend test conventions and runner
discovery rules:

- API unit tests use Jest and belong in nearby `__tests__/unit/*.spec.ts`.
- API repository integration tests belong in nearby
  `__tests__/int/*.int.spec.ts` and use the isolated test database.
- API end-to-end tests use Supertest in `apps/api/test/*.e2e-spec.ts`.
- Web unit and component integration tests use Vitest, Testing Library, and MSW
  in `*.spec.ts` or `*.spec.tsx` files beside the code they protect. Reuse
  `apps/web/src/test/` helpers and factories.
- Web browser tests use Playwright under `apps/web/e2e/`, following the applicable
  configuration. Keep intercepted-API tests distinct from full-stack journeys.

Run the smallest relevant tests first. After frontend changes, run relevant
focused tests plus web lint and build commands; use browser tests when changing
browser-level behavior. Follow [the API testing guide](docs/guides/testing.md)
and [the frontend testing guide](docs/guides/frontend-testing.md) for setup,
isolation, commands, and the limits of each layer.

## Commit & Pull Request Guidelines

Use concise Conventional Commit-style subjects, as in `feat(api): remove unnecessary configs` or `feat(docker): create docker configuration`. Prefer a type and optional scope: `feat(web): add entry form`, `fix(api): validate payload`. Keep commits focused. Pull requests should explain the user-visible or architectural change, link relevant issues, list validation performed, and include screenshots for UI changes. Never commit `.env` files or credentials; update `.env.example` when configuration requirements change.

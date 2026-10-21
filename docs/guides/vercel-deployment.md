# Unified Vercel deployment

## Current migration state

The unified deployment is being validated in the separate
`devlog-unified-preview` Vercel project. The existing `devlog` project and its
Render rewrite remain the production path until the owner asks to switch
`main`. Do not attach the production domain or change the production branch
during Preview validation.

The PostgreSQL database is hosted by Neon, independently of the Render API
service. Reusing its existing connection string preserves the records; this
change does not copy or reset the database. Preview tests against that database
must use an identifiable disposable account and avoid broad cleanup commands.

The repository has no scheduled jobs, queue consumers, or long-running workers
to move from Render. Render currently supplies the Nest API process; the old
Vercel project's `/api` rewrite points to that process. The unified project
replaces that compute path with the `gateway` and private `api` services while
leaving Neon and the old deployment available during validation.

## Request flow

The root `vercel.json` declares three services in one Vercel deployment:

| Service | Root | Responsibility |
| --- | --- | --- |
| `web` | `apps/web` | Build and serve the Vite application and SPA deep links. |
| `gateway` | `apps/gateway` | Receive the public `/api/*` path and forward HTTP requests. |
| `api` | Repository root | Build `Dockerfile.vercel`, run NestJS, and access PostgreSQL. It has no public top-level rewrite. |

The browser requests `/api/users` from its own deployment. The top-level route
sends it to `gateway`, which receives a deployment-specific
`BACKEND_INTERNAL_URL` service binding and calls Nest at `/api/users`. The
gateway carries request bodies, cookies, status codes, and response headers
back to the browser. This keeps the browser on one origin, so the auth cookie
does not need cross-origin CORS. The binding gives network reachability; Nest
continues to enforce JWT authentication and record ownership.

Vercel Services is a Beta feature. The gateway is a separate Node service
because the Vite static builder does not emit API functions from its service
root. A direct public rewrite to Nest would be simpler, but would expose the
backend service instead of using a private binding.

The API uses a container because the Services Node builder did not package
all Nest dependencies from this pnpm workspace. The container runs the same
compiled Nest server as local development and keeps pnpm's dependency layout.
Its image takes longer to build and upload than a bundled Node function.
`Dockerfile.vercel` generates Prisma Client with a placeholder URL at build
time; the actual database URL enters only at runtime. `.dockerignore` excludes
local environment files from the image.

The `web` service sets `VITE_API_URL=/api` in its build command. Vite embeds
this value into the browser bundle. The explicit build setting prevents a
developer's local `apps/web/.env` from accidentally sending a deployed browser
to `localhost` during CLI builds.

## Environment variables

Set these on the unified Vercel project. Store values in Vercel, never in Git
or a `VITE_*` variable unless the value is meant for the browser.

| Variable | Preview | Production | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | Secret | Secret | Existing Neon PostgreSQL URL. Keep the same database during the cutover; inspect migration status before applying schema changes. |
| `JWT_SECRET` | Secret | Secret | Preserve the current signing secret so existing sessions can remain valid after domain cutover. |
| `NODE_ENV` | `production` | `production` | Ensures the auth cookie has `Secure` in hosted deployments. |
| `VITE_API_URL` | `/api` or unset | `/api` or unset | The production build defaults to `/api`. This is public build configuration, not a secret. |
| `JWT_EXPIRES_IN_SECONDS` | Optional | Optional | Defaults to 3600 seconds; `JWT_EXPIRES_IN` is not read by the API. |

Do not set `BACKEND_INTERNAL_URL`: Vercel generates it from the gateway binding
for each deployment. The container listens on port 80 by default; Vercel can
override it with `PORT`. `CORS_ALLOWED_ORIGINS` is unnecessary for the
same-origin gateway path; keep the existing Render setting
while the old production deployment is live. Local development still uses
`apps/api/.env` and `apps/web/.env` with separate ports and explicit CORS.

## Validation and cutover

1. On this branch, run focused gateway and web tests, lint, and builds. Run
   `pnpm --filter api test:vercel-container` with Docker available to build the
   API image and check health, authorization, and secret exclusion. Use
   `vercel build --environment preview` to verify all three services. The
   `.vercelignore` excludes all local environment files and browser artifacts
   from a CLI upload. Run `playwright test --config
   playwright.vercel.config.ts` from `apps/web` with `VERCEL_PREVIEW_URL` and a
   Vercel OIDC token to check the browser's same-origin API requests without
   writing to the database.
2. Set the required Preview variables on `devlog-unified-preview` and deploy
   this branch to Preview. Confirm the deployment is Ready, a web deep link
   serves the SPA, `/api/health` returns Nest's JSON response, and unauthenticated
   `/api/users/me` returns 401 rather than an HTML fallback.
3. Run browser registration, login, reload, protected navigation, and logout
   with an identifiable test account. Check the `HttpOnly`, `Secure`,
   `SameSite=Lax` cookie and verify the account cannot read another user's
   data. The application has no user deletion endpoint; retain the test account
   unless its ownership is verified before targeted cleanup.
4. Inspect Prisma migration status against the existing database. Do not run
   `prisma migrate reset` or a seed script against it. Monitor Preview service
   errors and compare the existing production site's health.
5. Test a production-target deployment in the separate
   `devlog-unified-preview` project without moving the public domain. After
   owner approval, connect `main` as the production branch of the unified
   project and attach/promote the existing domain. Test the same flows on the
   final production URL. Keep Render and the old Vercel project available for
   rollback until the new deployment is verified.

The production switch is intentionally pending. Record the final Preview and
production URLs and changed links after each deployment, rather than assuming
the old hostname will remain attached automatically.

## Staged validation on 2026-10-21

| Target | URL | Result |
| --- | --- | --- |
| Preview of this branch | `https://devlog-unified-preview-alxrtll81-lucas-projects-36c39d5f.vercel.app` | Browser registration flow called `/api/health` and submitted the intercepted account request to this same origin. Earlier direct API calls registered and signed in with an identifiable test account in Neon. |
| Production target in the separate unified project | `https://devlog-unified-preview.vercel.app` | Deployment is Ready. `/register` and `/api/health` returned 200; `/api/users/me` returned 401 without a session. An earlier deployment of the same API completed registration, sign-in, session lookup, and sign-out against Neon. The current browser asset matches the Preview asset verified above. |
| Existing production project | `https://devlog-eosin.vercel.app` | Still points to the existing `devlog` project and Render path. No alias, Git branch, or domain was moved. |

Vercel Authentication protects the new project's Production target. Its local
development OIDC token accesses Preview but receives
`TRUSTED_SOURCES_ENVIRONMENT_MISMATCH` on Production, so the automated browser
test cannot run there under the current access rules. `vercel curl` verified
the protected Production HTTP responses. Keep the production browser journey
on the final cutover checklist; changing Trusted Sources requires a separate
access-control decision. The two identifiable API test accounts remain in the
shared database because the application has no targeted user deletion route.

Study topics: service bindings versus public rewrites, same-origin cookies,
immutable deployments, and the difference between a database migration and a
compute migration.

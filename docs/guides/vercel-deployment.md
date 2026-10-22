# Unified Vercel deployment

## Current migration state

The `main` branch contains the unified deployment. Its previous tip,
`91370fa`, is preserved as
`backup/main-before-unified-vercel-2026-10-21`. The Vercel project
`devlog-unified-preview` is connected to `Lucalopezz/DevLog`, tracks `main` for
Production, and has Git deployments enabled. The former `devlog` Vercel
project is paused and disconnected from Git, so a push to `main` has one
production deployment target.

`https://devlog-eosin.vercel.app` is attached to the unified project. The old
project retains `https://devlog-antigo.vercel.app` as a rollback reference.
Keep the old project's configuration and Render service intact until the
Git-triggered production deployment has been checked on the public domain.

The PostgreSQL database is hosted by Neon, independently of the Render API
service. Reusing its existing connection string preserves the records; this
change does not copy or reset the database. Tests against that database must
use an identifiable disposable account and avoid broad cleanup commands.

The repository has no scheduled jobs, queue consumers, or long-running workers
to move from Render. Render supplied the former Nest API process; the old
Vercel project's `/api` rewrite pointed to it. The unified project serves the
public `/api` path through the `gateway` and private `api` services. Neon stays
independent of either compute provider.

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

The gateway removes conditional cache validators from incoming API requests and
marks API responses `Cache-Control: private, no-store`. Nest emits ETags by
default; forwarding a browser's `If-None-Match` caused authenticated collection
reads to return 304 without JSON. These responses depend on the session cookie,
so browser and shared caches must not reuse them.

Node's `fetch` transparently decompresses upstream responses but leaves the
upstream `Content-Encoding` and `Content-Length` headers visible. The gateway
removes both before sending the decoded body to the browser; otherwise larger
compressed collections can fail to decode even when the API and gateway log 200.

Vercel Services is a Beta feature. The gateway is a separate Node service
because the Vite static builder does not emit API functions from its service
root. A direct public rewrite to Nest would be simpler, but would expose the
backend service instead of using a private binding.

The API uses a container because the Services Node builder did not package
all Nest dependencies from this pnpm workspace. The container runs the same
compiled Nest server as local development and keeps pnpm's dependency layout.
Its image takes longer to build and upload than a bundled Node function.
At container startup, the API runs `prisma migrate deploy` before Nest listens.
Vercel supplies the sensitive production database URL only at runtime, and
Prisma records applied migrations so concurrent container starts remain safe.
This makes pending schema changes part of a deployment, but database
availability now also affects startup time and readiness. Migrations must remain
compatible with the previous deployed code while a new deployment rolls out.
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
same-origin gateway path. Local development still uses
`apps/api/.env` and `apps/web/.env` with separate ports and explicit CORS.

## Validation and rollback

1. Open a pull request against `main` and wait for its required `quality`,
   `integration`, Vercel Preview, and GitGuardian checks. The workflow uses a
   disposable PostgreSQL database;
   see the [CI guide](testing.md#pull-request-ci). For changes to the Vercel
   container or service routing, additionally run
   `pnpm --filter api test:vercel-container` with Docker available to build the
   API image and check health, authorization, and secret exclusion. Use
   `vercel build --environment preview` to verify all three services. The
   `.vercelignore` excludes all local environment files and browser artifacts
   from a CLI upload. Run `playwright test --config
   playwright.vercel.config.ts` from `apps/web` with `VERCEL_PREVIEW_URL` and a
   Vercel OIDC token to check the browser's same-origin API requests without
   writing to the database.
2. Confirm the required Preview and Production variables remain set on
   `devlog-unified-preview`. Check the Preview deployment is Ready, a web deep link
   serves the SPA, `/api/health` returns Nest's JSON response, and unauthenticated
   `/api/users/me` returns 401 rather than an HTML fallback.
3. Run browser registration, login, reload, protected navigation, and logout
   with an identifiable test account. Check the `HttpOnly`, `Secure`,
   `SameSite=Lax` cookie and verify the account cannot read another user's
   data. The application has no user deletion endpoint; retain the test account
   unless its ownership is verified before targeted cleanup.
4. Inspect startup logs to confirm `prisma migrate deploy` completed against the
   existing database. Do not run `prisma migrate reset` or a seed script against
   it. Monitor service errors and check the public domain's health after each
   production deployment.
5. A push to `main` should create a Production deployment in
   `devlog-unified-preview`. Verify its Git commit, Ready state, and the public
   domain before considering the release complete. To roll back code, promote a
   previous unified deployment. To return to the old architecture, reconnect
   the paused project to the backup branch, resume it, and move the domain
   back. The database is shared and is not rolled back by moving an alias.

## Staged validation on 2026-10-21

| Target | URL | Result |
| --- | --- | --- |
| Preview of this branch | `https://devlog-unified-preview-ipshnnr9k-lucas-projects-36c39d5f.vercel.app` | Deployment is Ready. The browser registration test passed with same-origin API requests after the gateway compression fix. A real HTTP regression test also confirmed that compressed collection JSON remains readable through the gateway. Earlier direct API calls registered and signed in with an identifiable test account in Neon. |
| Precutover Production target in the separate unified project | `https://devlog-unified-preview.vercel.app` | Deployment `dpl_CG9UfgqwEHPMoS3A7Gx8CA4FqJZW` is Ready with the compression fix. `/api/health` returned 200 with JSON and `private, no-store` even when requesting gzip; `/api/project` returned 401 without a session. An earlier deployment of the same API completed registration, sign-in, session lookup, and sign-out against Neon. The owner reloaded the dashboard and confirmed that existing projects and entries appeared. |
| Former production project | `https://devlog-antigo.vercel.app` | The `devlog` project is paused and disconnected from Git. Its former deployment is retained for rollback but does not serve traffic or receive new commits. |
| Public production domain | `https://devlog-eosin.vercel.app` | Git push of `468d4c6` to `main` automatically created Production deployment `dpl_25DjxccjqPfkxEGPgdHfip7JmLCj`. It became Ready and received the public alias. `/dashboard` returned 200 HTML, `/api/health` returned 200 JSON, and unauthenticated `/api/project` returned 401 JSON. The owner reloaded this domain after the Git cutover and confirmed that existing projects and entries appeared. |

Vercel Authentication protects generated Production deployment URLs, while the
attached public domain is served without that protection. The local development
OIDC token accesses Preview but receives
`TRUSTED_SOURCES_ENVIRONMENT_MISMATCH` on protected Production URLs. Use the
public domain for the final browser journey. The two identifiable API test
accounts remain in the shared database because the application has no targeted
user deletion route.

Study topics: service bindings versus public rewrites, same-origin cookies,
immutable deployments, and the difference between a database migration and a
compute migration.

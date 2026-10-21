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

## Request flow

The root `vercel.json` declares three services in one Vercel deployment:

| Service | Root | Responsibility |
| --- | --- | --- |
| `web` | `apps/web` | Build and serve the Vite application and SPA deep links. |
| `gateway` | `apps/gateway` | Receive the public `/api/*` path and forward HTTP requests. |
| `api` | `apps/api` | Run NestJS and access PostgreSQL. It has no public top-level rewrite. |

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
for each deployment. `PORT` is managed by Vercel. `CORS_ALLOWED_ORIGINS` is
unnecessary for the same-origin gateway path; keep the existing Render setting
while the old production deployment is live. Local development still uses
`apps/api/.env` and `apps/web/.env` with separate ports and explicit CORS.

## Validation and cutover

1. On this branch, run focused gateway and web tests, lint, and builds. Use
   `vercel build --environment preview` to verify service packaging. The
   `.vercelignore` excludes all local environment files and browser artifacts
   from a CLI upload.
2. Set the required Preview variables on `devlog-unified-preview` and deploy
   this branch to Preview. Confirm the deployment is Ready, a web deep link
   serves the SPA, `/api/health` returns Nest's JSON response, and unauthenticated
   `/api/users/me` returns 401 rather than an HTML fallback.
3. Run browser registration, login, reload, protected navigation, and logout
   with a disposable account. Check the `HttpOnly`, `Secure`, `SameSite=Lax`
   cookie and verify the account cannot read another user's data. Remove only
   records created for this validation after confirming ownership.
4. Inspect Prisma migration status against the existing database. Do not run
   `prisma migrate reset` or a seed script against it. Monitor Preview function
   errors and compare the existing production site's health.
5. After owner approval, connect `main` as the production branch of the unified
   project, stage and test a production deployment without moving the public
   domain, then attach/promote the existing domain. Test the same flows on the
   production URL. Keep Render and the old Vercel project available for rollback
   until the new deployment is verified.

The production switch is intentionally pending. Record the final Preview and
production URLs and changed links after each deployment, rather than assuming
the old hostname will remain attached automatically.

Study topics: service bindings versus public rewrites, same-origin cookies,
immutable deployments, and the difference between a database migration and a
compute migration.

# API availability and cold starts

Implemented on October 8, 2026. The unified Vercel deployment is being
validated separately; see [the deployment guide](vercel-deployment.md).

## Architecture and purpose

DevLog serves a React + Vite application and calls its API with Axios. In a
hosted build, the browser sends a same-origin `GET /api/health` through the
gateway's private service binding to Nest's existing `/api/health` endpoint.
Local development can still call Nest directly through `VITE_API_URL`.
The request omits credentials, uses `cache: 'no-store'`, and requires Nest's
`{ "status": "ok" }` response. An HTTP 200 hosting-provider loading page is not
considered a successful check. Nest also returns `Cache-Control: no-store`.
This is a liveness check; it does not verify database availability.

This supervision began while the API ran on Render's sleeping Free service.
On Vercel it remains useful for temporary network or function failures, but
periodic checks also consume gateway and API requests. It does not guarantee
that a cold function starts faster.

## Responsibilities and data flow

- `lib/backend-connection.ts` owns connection state, health rounds, timers,
  browser events, cancellation, and the shared `ensureReady()` promise.
- `BackendConnectionProvider`, mounted in `AppProviders`, subscribes with
  `useSyncExternalStore`. It displays accessible connection notices on all
  routes and recovers failed active queries without clearing the cache.
- Axios records successful API contacts, including HTTP 4xx responses that
  prove reachability. Temporary network errors and HTTP 502/503/504 invalidate
  that contact. Ordinary successful traffic can replace an unnecessary ping.
- `useLogin` and `useRegister` receive validated form data and await
  `ensureReady()` before sending it once. React Query's mutation pending state
  includes the health wait, so the existing forms block duplicate submissions
  and retain entered values on failure.
- TanStack Query owns the general read retry policy. Axios applies the read
  timeout. Keeping retries in one layer avoids multiplying attempts.
- The router shows a skeleton during initial session validation and an error
  page with manual retry. Failed loaders have no active query observer, so the
  error boundary revalidates them after a detected recovery.

The controller is an external store because timers and in-flight requests must
remain shared across navigation and forms. A new controller can be injected in
tests without mocking React or relying on production's singleton state.

## Scheduling and limits

| Control | Value |
| --- | --- |
| Periodic check while visible and online | 5 minutes |
| Automatic event cooldown | 10 seconds |
| Health attempts per round | At most 3 |
| Delays before the second and third attempt | 2 seconds, 5 seconds |
| Deadline per health attempt | 22 seconds, including response body |
| Delay before displaying the waiting notice | 1.5 seconds |
| Axios GET/HEAD timeout, unless explicitly configured | 15 seconds |
| General QueryClient read retry | At most one retry for temporary errors |
| Mutation retries | Disabled |

A fully timed-out health round can take up to 73 seconds. Initial reads and
health checks run in parallel; a failed route can recover when the health round
finishes. Some feature queries and authentication loaders already set
`retry: false`; they retain that policy and use explicit or connection recovery.
Axios API helpers called outside QueryClient do not automatically retry.

`visibilitychange`, focus, `pageshow`, and internet reconnection check the last
successful contact. Nearby events and forms share the current round. Hiding a
tab cancels the periodic timer; returning checks again when contact is stale.
Losing internet aborts the current round and invalidates the previous contact.
Unmounting removes listeners, aborts the round, and clears timers. Cancellation
from React StrictMode does not turn into an unavailable-server notification.

## Recovery, authentication, and writes

Connection recovery refetches only active queries with temporary errors.
Inactive queries, successful cached collections, 401/404/business errors, and
mutations are not replayed. Query data is retained; each feature still owns its
loading/error presentation. Existing section error screens can replace their
content while cached data remains available for a later successful read.

Separately, after a successful connection check, a stale, previously successful
active profile query is rechecked. This detects actual session expiration.
`ProtectedSession` clears user-scoped cache and returns to login only after the
profile receives a 401. Initial protected-route loaders already redirect only
on 401. Timeout, offline, 502, 503, and 504 never trigger logout or remove the
authentication cookie. Health checks do not renew the JWT.

Writes keep their existing timeout behavior and a single send. A lost response
can mean a write succeeded even if the browser saw a failure. Automatic replay
would risk duplicates. If stronger guarantees become necessary, implement
server-side idempotency keys before introducing automatic write retries.

HTTP 5xx messages use the operation's public fallback; validation messages from
4xx responses remain visible. Internal infrastructure details belong in server
logs, rather than form toasts or the route error page.

## Local configuration and deployment

No new environment variable is required for connection supervision. A hosted
build defaults to `/api`; if set, `VITE_API_URL` must include `/api` because
Vite embeds it during build. Local cross-origin development requires the Vite
origin in `CORS_ALLOWED_ORIGINS`. The hosted gateway path is same-origin.

| Local file | Purpose |
| --- | --- |
| Root `.env` | Docker database credentials and ports |
| `apps/api/.env` | Development database, API port, JWT, and CORS |
| `apps/api/.env.test` | Separate test database on port 5433 and API on 3001 |
| `apps/web/.env` | Public API base URL on port 3000 |

These files are ignored by Git. The development JWT secret is randomly generated.
The API reads `JWT_EXPIRES_IN_SECONDS`, not `JWT_EXPIRES_IN`; the updated examples
use 3600 seconds, matching the existing authentication cookie lifetime.
Test CORS origins are explicit because wildcards are rejected outside development.

The frontend performs no periodic check when hidden. Closed browsers,
suspended devices, and discarded tabs cannot trigger checks. A first cold start
remains possible. The five-minute visible-tab check was retained for this
migration to avoid changing form and recovery behavior at the same time; it
costs additional Vercel service requests and can be removed in a separate,
tested change if measurements show little recovery benefit.

## Validation

Unit/component tests cover shared rounds, retries, deadlines, event scheduling,
offline recovery, StrictMode cleanup, safe query recovery, form gating, and
public error messages. Playwright uses an intercepted API to test navigation,
failed private-route recovery, offline preservation, and real 401 handling.
These browser tests verify application behavior, not production cold-start
latency or deployment cookies.

Local validation results for this delivery:

- Web lint, production build, and browser-test TypeScript checks passed.
- Vitest: 416 of 424 tests passed. The remaining eight failures also reproduce
  in a temporary snapshot of the unchanged `HEAD`: six in
  `technical-entry-detail-page.spec.tsx` and two in `project-detail-page.spec.tsx`.
  They are pre-existing fixture/UI expectations outside connection supervision.
- Playwright: all eight connection and route-access scenarios passed in Chromium.
- API environment configuration: four unit tests passed; the public health
  HTTP contract passed its existing end-to-end test without a live database.

From the repository root:

```bash
pnpm --filter web test
pnpm --filter web lint
pnpm --filter web build
pnpm --filter web typecheck:e2e
PLAYWRIGHT_BROWSERS_PATH=apps/web/.playwright-browsers pnpm --filter web exec playwright install chromium
pnpm --filter web test:e2e e2e/mocked/api-warmup.spec.ts
pnpm --filter api exec prisma generate
pnpm --filter api test:e2e health.e2e-spec.ts
```

On this machine, Node 26's experimental Web Storage conflicts with jsdom.
Run Vitest with `NODE_OPTIONS=--no-experimental-webstorage` when using that runtime.
For deployment, verify an API cold start, direct private navigation, returning
after an idle period, internet loss during a form draft, and expired JWTs.
Compare observed timing before and after deployment before claiming latency gains.

Topics worth studying: external stores, cancellation with `AbortController`,
liveness versus readiness, HTTP idempotency, query observers versus router
loaders, and session expiry versus network availability.

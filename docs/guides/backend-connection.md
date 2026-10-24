# API requests and failure recovery

The frontend sends API requests directly. Following the Vercel migration, the
browser no longer warms the API, periodically polls health, shows global
connection notices, or waits for a health check before login and registration.
The removed supervision originated with Render's sleeping Free service.

## Request flow and responsibilities

- `api/http.ts` configures the base URL, browser credentials, JSON headers, and
  a 15-second timeout for GET/HEAD requests unless a caller provides a deadline.
  It does not track a separate global connection state.
- Feature request helpers call their endpoints directly. `useLogin` and
  `useRegister` submit validated data through their mutation. The mutation's
  pending state covers the POST, blocks duplicate submissions, and preserves
  the form draft after a failure.
- TanStack Query owns cached server data and read retries. The shared policy
  permits one retry for network/timeouts and HTTP 502/503/504; authentication
  loaders and features with `retry: false` keep their explicit policy.
- Stale active queries use TanStack Query's default refetch on tab visibility
  and internet reconnection. Returning to the app can therefore refresh stale
  profile and feature data directly, without first checking health. Successful
  data remains cached; there is no independent connection recovery controller.
- The router shows its loading screen during initial session validation and
  a page error when that read fails. **Try loading again** revalidates the
  failed loader directly, with the button disabled while it is loading.

A health response cannot guarantee that the next authenticated request or
write will succeed. Removing that prerequisite avoids an extra round trip and
allows business requests to succeed even if the health endpoint is unavailable.
It also removes periodic gateway/API traffic from visible idle tabs.

## Sessions and writes

Only a confirmed HTTP 401 from the session request clears user-scoped data and
returns the user to login. Network errors, timeouts, and server failures preserve
the session and cache. `ProtectedSession` still observes the shared profile
query, including a stale profile refetched when the user returns to the tab.

Writes are never retried automatically. A lost response can mean the database
already accepted the operation; replaying it could create duplicates. The user
can review the result and deliberately retry. Stronger automatic guarantees
would require server-side idempotency support.

HTTP 5xx responses use the operation's public fallback message, while useful
4xx validation messages remain visible. Internal infrastructure details stay in
server logs rather than form notifications or the route error page.

## Health endpoint and Vercel trade-offs

`GET /api/health` remains available for monitoring, deployment checks, and local
test-server readiness. It returns Nest's `{ "status": "ok" }` response with
`Cache-Control: no-store`. This is a liveness check, not a database readiness
check. The frontend does not call it automatically.

The API uses Vercel's container runtime. [Vercel's scale-in behavior](https://vercel.com/docs/functions/runtimes/container#scale-in-behavior)
still allows idle containers to scale down, so removing browser supervision
cannot eliminate cold-start latency. An initial request may take longer or
reach its existing deadline. The trade-off is simpler request handling and
fewer service invocations, without claiming a deployment latency improvement.

See [the unified deployment guide](vercel-deployment.md) for same-origin `/api`
routing through the gateway. `VITE_API_URL` remains the public build-time
configuration for local cross-origin development; no configuration change is
required by this removal.

## Validation

Component tests cover public routes without health probes, direct login and
registration while health is unavailable, pending submission, preserved drafts,
manual loader recovery, and the distinction between HTTP 401 and outages.
Shared-client tests protect read deadlines and single-send writes.

Browser tests in `apps/web/e2e/mocked/api-availability.spec.ts` cover navigation,
a lost login response followed by deliberate retry, direct private-route
recovery, idle/browser events without health polling, and a stale profile's
401 response on return. These intercept API responses; they establish frontend
behavior rather than real deployment latency or server cookie correctness.

From the repository root:

```bash
NODE_OPTIONS=--no-experimental-webstorage pnpm --filter web test
pnpm --filter web lint
pnpm --filter web build
pnpm --filter web typecheck:e2e
pnpm --filter web test:e2e e2e/mocked/api-availability.spec.ts
```

Node 26's experimental Web Storage conflicts with jsdom, so the Vitest command
uses the existing compatibility option. After deployment, check an idle first
request, direct protected navigation, temporary connection loss with a draft,
and an expired session before drawing conclusions about production timing.

Topics worth studying: liveness versus readiness, HTTP idempotency, query
freshness and focus refetching, and session expiry versus network availability.

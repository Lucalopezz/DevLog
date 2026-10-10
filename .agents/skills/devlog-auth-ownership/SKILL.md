---
name: devlog-auth-ownership
description: "Implement or change DevLog login, session handling, and authorization for user-owned records and nested resources."
---

# DevLog Auth and Ownership

Read the relevant sections of [authentication flow](../../../docs/guides/authentication_workflow.md)
and [implemented account use cases](../../../docs/usecases/account-and-tags.md).
Inspect the current auth controller, guard, token provider, global configuration,
and frontend session consumers. The authentication guide includes historical and
future phases; establish current behavior from source before changing it.

## Preserve the session boundary

- The API authenticates JWTs supplied in an HttpOnly cookie. The frontend uses
  the shared credentialed HTTP client and the current-user request. Do not
  expose the token in a response body or store it in browser storage.
- Obtain the acting user's ID from the verified session, not a client-supplied
  owner field. Keep cookie and Express details in HTTP infrastructure.
- Keep password hashes and token secrets out of public outputs, presenters,
  logs, test fixtures intended for users, and documentation examples.
- Check cookie creation and clearing options together, including origin,
  environment, path, and credentialed CORS behavior. When changing cookie-based
  writes, inspect the existing CSRF protection assumptions as part of that change.

## Authorize the actual resource

Authentication identifies the caller; it does not establish ownership of a
requested record. Trace the owner through the resource hierarchy.

- Direct resources such as projects, entries, and tags require owner-scoped
  reads and writes according to the existing repository/use-case pattern.
- For an environment or another project child, verify that the caller owns the
  project and that the child belongs to that same project.
- For a solution attempt or tag assignment, verify the entry owner and all
  associated resources. An existing foreign key does not prove common ownership.
- Keep list totals, filters, and pagination scoped as well as the returned rows.
  Preserve the current not-found behavior for inaccessible resources so a new
  endpoint does not reveal another user's records.

On the frontend, follow existing protected/guest route behavior and session
query ownership. Inspect logout and account-switch flows for clearing protected
cached data. Handle `401` as an authentication failure while preserving the
distinction from an unavailable backend.

## Verify the boundary

Test missing/invalid sessions and attempts by a second user to list, read, edit,
or delete affected records. Include a child ID belonging to a different parent
when changing nested routes. Use actual API tests for server authorization;
mocked browser responses alone cannot establish cookie or ownership correctness.

Keep checks limited to the changed authentication or authorization behavior.
Do not expand ordinary feature work into an unsolicited system-wide security
audit or add a new session architecture without a concrete requirement.

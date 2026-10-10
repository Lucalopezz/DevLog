---
name: devlog-frontend-data-flow
description: "Implement DevLog forms, API calls, queries, mutations, and URL filters with explicit state ownership and cache synchronization."
---

# DevLog Frontend Data Flow

Read the affected sections of [frontend organization](../../../docs/guides/frontend_structure.md)
and inspect neighboring schemas, request helpers, query keys, hooks, and forms.
For concrete compositions, consult [account settings](../../../docs/guides/account-settings.md),
[activity timeline](../../../docs/guides/activity-timeline.md), or
[knowledge overview](../../../docs/guides/knowledge-overview.md) only when relevant.

## Assign each state an owner

- Component state owns temporary interaction state, such as an open dialog.
  React Hook Form owns the editable draft; Zod and its resolver validate it.
- URL parameters own shareable filters and navigation state when the existing
  flow supports deep links. TanStack Query owns server data and request state.
  Avoid synchronizing a second copy of query data in an effect.
- Feature request helpers own endpoints, payload mapping, and response types.
  Hooks coordinate queries, mutations, cache updates, and existing notifications.
  Pages compose these pieces rather than configuring Axios or cache keys.

## Trace forms end to end

Follow values through the form, schema/resolver, input mapping, mutation, shared
[HTTP client](../../../apps/web/src/api/http.ts), and API response. Distinguish
form values from request values, especially empty strings, nullable fields,
omitted update fields, and schema transformations. Use inferred schema types
and the existing input/output typing pattern instead of assertions that conceal
a mismatch.

For edit forms, initialize or reset at a deliberate lifecycle boundary so a
background response cannot silently overwrite an active draft. Close or reset
only after the intended success condition. Preserve input after failures and
avoid duplicate feedback when the mutation already reports the error.

## Synchronize server data

- Include all response-affecting inputs in query keys, including owner scope,
  filters, sorting, and pagination. Keep finite and infinite query data under
  distinct key shapes.
- Identify every affected consumer before updating or invalidating the cache.
  An environment mutation can affect both its project tab and the global page;
  technical-entry mutations can affect composed journal views.
- Choose targeted invalidation or an explicit cache update from an authoritative
  response. Use optimistic updates only when the benefit justifies rollback and
  conflict handling. Preserve existing pending-state semantics when awaiting
  invalidation.
- Reuse supplying features' requests and keys for composed views. Do not create
  a duplicate API layer just because a screen displays the same data differently.

Keep temporary connectivity failures distinct from authorization and business
errors. Follow the shared client's retry behavior: losing a write response does
not prove that the write failed, so do not automatically repeat mutations.

Explain how the collaborating hooks divide responsibilities, and test observable
submission, filtering, failure recovery, or cache synchronization behavior.

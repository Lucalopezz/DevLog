---
name: devlog-architecture-review
description: "Review DevLog features or refactors for concrete responsibility, dependency, and contract problems when architectural review is requested."
---

# DevLog Architecture Review

Establish the requested review scope, intended behavior, and diff or affected
files. Read the applicable [backend structure](../../../docs/guides/backend_structure.md)
or [frontend structure](../../../docs/guides/frontend_structure.md) and relevant
business use cases. Inspect callers and tests before judging an isolated file.

## Follow one behavior through its boundaries

For the backend, trace HTTP input, use-case coordination, domain rules,
repository contracts, persistence, and output mapping. For the frontend, trace
route state, page composition, form/schema state, hooks, HTTP requests, and cache
synchronization. Review the path affected by the task rather than auditing every
module in the repository.

Look for concrete consequences of:

- Business rules bypassed by a controller or repository write.
- Infrastructure details leaking across a boundary without an established reason.
- Shared code depending on a specific DevLog domain.
- Duplicate state, API layers, or mappings that can diverge across consumers.
- An abstraction or new package whose complexity is not justified by actual use.
- Public contract changes missing consumers, tests, or supporting documentation.
- Ownership, lifecycle, transaction, or asynchronous-state gaps relevant to the
  reviewed behavior.

Distinguish a violated invariant from an architectural preference. Current Nest
exceptions in the application layer, current validator dependencies, and
documented cross-feature imports are established trade-offs; their existence
alone is not a defect. Explain when a changed requirement makes a trade-off
worth revisiting.

## Present actionable findings

For each material finding, provide a file location, triggering scenario,
consequence, supporting evidence, and a focused correction. Order findings by
impact. Do not invent findings to fill a checklist or report lint preferences
as architectural failures.

Separate optional improvements from defects that threaten the intended behavior.
Explain the relevant concept and a reasonable alternative when that helps the
user learn. Identify a meaningful validation gap without claiming unexecuted
tests passed.

A review request authorizes inspection and recommendations, not implementation
of every suggestion. Apply corrections only when the user also requested fixes
or implementation. Keep accepted corrections scoped to the reviewed objective.

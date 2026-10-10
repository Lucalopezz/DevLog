---
name: devlog-documentation
description: "Create or update DevLog documentation when behavior, API contracts, architecture decisions, setup, or implementation status changes."
---

# DevLog Documentation

Use the [documentation index](../../../docs/README.md) to find the maintained
document for the affected subject. Inspect the implementation and existing
documentation before deciding whether a new document is necessary. Follow the
repository's English-language standard for content and examples.

## Choose the document by purpose

| Purpose | Location |
| --- | --- |
| Accepted product, architecture, or persistence decision | `docs/decisions/` |
| Explanation of an implemented technical flow or setup | `docs/guides/` |
| Actor goal, business rule, and API behavior | `docs/usecases/` |
| Structure or sequence that benefits from a visual | `docs/diagrams/` |
| Explicitly pending work | `docs/backlog/` |

Update the existing document when it already owns the subject. Add a new document
to the documentation index when the new subject warrants one. Keep artifact names
and commands consistent with the actual source.

## Explain the reasoning

Describe the problem, resulting behavior, relevant responsibility boundaries,
chosen approach, and material trade-offs. Include a short data-flow example when
it helps someone studying the code understand how the pieces cooperate.

For a significant architectural decision, explain the reasonable alternatives
and the requirement that favored the chosen one. Recommend a study topic only
when it directly clarifies the implementation. Do not copy general framework
tutorials into the repository.

Label accepted decisions, implemented behavior, historical plans, and future
ideas accurately. An old plan may contain obsolete fields or unfinished phases;
do not silently treat it as the current contract or claim a task is complete
without implementation evidence.

## Keep related artifacts consistent

- For public API changes, check feature use cases and
  [route traceability](../../../docs/usecases/traceability.md).
- For setup changes, check root/application READMEs, relevant guides, and
  `.env.example` files. Include example configuration, never actual credentials.
- For changed relationships or flows, update the existing source diagram format
  where appropriate. A diagram does not require creating a Figma file.
- Update backlog/status statements only when the implemented and validated work
  supports the new status.
- Keep explanations in one maintained location and link to them from skills or
  related documents rather than copying rules into several files.

Verify local links, file paths, route names, and command examples. For
documentation-only edits, report document verification and do not imply that
application tests were run. Keep the update proportional to the changed behavior.

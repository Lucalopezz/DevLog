---
name: devlog-structure
description: "Choose locations and dependency boundaries before creating or moving DevLog files, features, tests, or shared code."
---

# DevLog Structure

Choose a file's home from its responsibility and the existing project structure.
Read [repository instructions](../../../AGENTS.md) and the relevant
[backend guide](../../../docs/guides/backend_structure.md) or
[frontend guide](../../../docs/guides/frontend_structure.md). Resolve these
links relative to this skill's directory.

## Placement workflow

1. Identify the owning application, business domain, and responsibility. Search
   for an existing implementation or extension point before adding a file.
2. Inspect nearby files and imports. Use the applicable guide to distinguish a
   deliberate convention from an incidental inconsistency.
3. Choose the smallest existing location that fits. Briefly explain a meaningful
   placement decision before making a structural change; group related files in
   one explanation rather than narrating each file creation.
4. When moving code, update imports, dependency injection, tests, and documentation
   references. Keep behavior unchanged unless the requested task includes it.

## Backend decisions

- Organize each business module by `application`, `domain`, and `infrastructure`,
  then by capability when that capability has enough artifacts to justify it.
  Match capability names across the layers where they exist.
- Small modules may remain flat inside each layer. A capability directory does
  not establish a DDD aggregate or a new Nest module.
- Keep technical-entry tag associations in `tag-assignment`; the independent
  tag business module owns tags themselves.
- Keep unit tests under the nearby `__tests__/unit/`, integration tests under
  `__tests__/int/`, and API end-to-end tests in `apps/api/test/`. Check the Jest
  discovery configuration before introducing a different location.

## Frontend decisions

- Put domain-aware requests, schemas, types, hooks, components, and pages inside
  the owning `features/` directory. For example, a `ProjectCard` belongs to
  `features/projects/components/`, even when several screens use it.
- Shared `api/`, `lib/`, and `components/` code must remain domain-independent.
  Put providers in `app/` and route composition and guards in `routes/`.
- Place imported assets in `src/assets/` and directly served assets in `public/`.
- Composed views can reuse supplying features without duplicating their API
  layer. Inspect the existing cross-feature contract before changing imports;
  introduce an intentional public boundary when justified, not blanket barrels.
- Keep frontend behavior tests beside the feature code and shared test helpers
  in `src/test/`; browser tests follow the Playwright configuration.

Use `packages/` only for a real dependency shared across workspace applications.
Keep infrastructure in `docker/` and explanations in `docs/`. Avoid speculative
folders and reorganizing unrelated code to make the tree look uniform.

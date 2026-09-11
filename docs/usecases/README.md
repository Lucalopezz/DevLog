# DevLog API use cases

This is the **as-is** behavioral documentation of the API in the current
working tree. It describes what the code implements now without treating
backlog or future intentions as implemented requirements. Update this index and
the relevant use case when an API behavior changes.

## Reading this documentation

Each case follows the full format used in the course: primary actor, interests, preconditions, trigger, postconditions, main flow, and alternative flows. Endpoints provide traceability only; steps avoid implementation details because a use case describes **what** happens.

Documents are grouped by area:

- [Account, authentication, and tags](account-and-tags.md)
- [Projects, technologies, commands, and resources](projects.md)
- [Technical entries, classifications, and attempts](technical-entries.md)
- [Endpoint → use case matrix](traceability.md)
- [Historical/planned specification](cases.md)

Related diagrams are listed in the [diagram index](../diagrams/README.md).

## Actors

| Actor | Type | Responsibility |
| --- | --- | --- |
| Guest | Primary | Creates an account or starts a session. |
| Authenticated user | Primary; specialization of Guest | Manages only their own data. |

The current code has no external secondary actor. The database, controllers, use cases, and JWT/hash providers are internal API components, so they are not actors in the use case diagram.

## Verified cross-cutting rules

1. Every protected endpoint requires a valid JWT in the HttpOnly `access_token` cookie.
2. Resources belonging to another user are reported as not found. This prevents access without confirming that the other resource exists.
3. Identifier parameters are UUIDs; bodies and queries reject undeclared fields and invalid data with status `422`.
4. Lists are paginated and have their own sorting and filters.
5. Successful deletions return no content.
6. `null` clears associations or optional values only where the contract allows it; omission preserves the current value.
7. Project names are unique per authenticated user; attempting to create a duplicate returns `409 Conflict`.

## Domain vocabulary

| Term | Meaning |
| --- | --- |
| Project | Development context to which entries, technologies, commands, and resources may belong. |
| Technical entry | An issue (`ISSUE`) or lesson learned (`LEARNING`). |
| Solution attempt | Documented experiment for an issue, with a `FAILED`, `PARTIAL`, or `SUCCESSFUL` result. |
| Tag | Reusable classification unique to a user. |
| Archived | Content excluded from default queries, without necessarily being deleted. |
| Resolved | State derived from `resolvedAt`, applicable only to issues. |

## Modeling decisions

- Request authentication is not modeled as `<<include>>` in dozens of cases. The specialized Authenticated user actor communicates the same precondition and keeps the diagram readable.
- Technologies, commands, and resources are project parts: they are created within it and deleted in a cascade when the project is deleted.
- Attempts belong to a technical entry and depend on its lifecycle.
- The entry/tag link has its own information (`createdAt`), so it appears as an association class.
- The project/entry link is an optional association, not composition: deleting the project preserves the entry and only removes its reference.

The web application exposes these project rules through the project detail
Settings tab. Archive and restore use explicit lifecycle endpoints, while
delete requires an unarchived project and confirmation in the interface.

## Points observed in the current code

These items were not changed in the models; they are documented to keep the diagrams faithful to the implementation:

- The domain calls the intermediate project state `INACTIVE`, while the database stores `PAUSED`. A mapper explicitly translates these values.
- Archived projects are read-only for their details, technologies, commands, and resources. Archived technical entries can still be updated, resolved, reopened, classified, have existing attempts changed/removed, and be deleted. Only adding a new attempt explicitly blocks archived entries.
- There is no operation to restore an archived technical entry.
- Logout removes the local cookie, but the server does not revoke the token.
- The API accepts `conclusion` when creating/editing a `LEARNING`; the domain only prohibits `resolvedAt` for this type. Conclusion and resolution are not synonyms in the implementation.
- An attempt result can be set on creation, but the public update only changes its description.
- Entry search omits archived records by default; project search filters archiving only when the parameter is supplied.

These points are natural candidates for product decisions or characterization tests before future changes.

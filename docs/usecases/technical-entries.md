# Use cases — technical entries

All use cases in this file use the **Authenticated user** actor. An entry,
tag, project, or attempt outside the user's scope is treated as not
found, avoiding disclosure of another account's data.

## UC-30 — Create technical entry

| Field          | Description                                                                      |
| -------------- | -------------------------------------------------------------------------------- |
| Primary actor  | Authenticated user                                                               |
| Interests      | Document an issue or learning and optionally associate it with an owned project. |
| Preconditions  | An existing account; the supplied project must be owned and unarchived.          |
| Trigger        | The user provides a title, context, type, and optional data.                     |
| Postconditions | An unarchived entry belonging to the user is created.                            |
| Endpoint       | `POST /api/technical-entry`                                                      |

### Main flow

1. The user provides a title, context, type (`ISSUE` or `LEARNING`), and optional project and
   conclusion.
2. If a project is supplied, the system verifies ownership and availability.
3. The system validates and saves the entry.
4. The system returns the created entry.

### Alternative flows

- A missing, another user's, or archived project is treated as not found.
- Invalid data prevents creation.
- Providing a conclusion does not automatically mark an `ISSUE` as resolved.

## UC-31 — Search technical entries

| Field          | Description                                                                  |
| -------------- | ---------------------------------------------------------------------------- |
| Primary actor  | Authenticated user                                                           |
| Interests      | Retrieve personal history by project, title, type, status, or archive state. |
| Preconditions  | Authenticated request.                                                       |
| Trigger        | The user requests a page with optional criteria.                             |
| Postconditions | No state change.                                                             |
| Endpoint       | `GET /api/technical-entry`                                                   |

### Main flow

1. The user provides optional filters, pagination, and sorting.
2. If a project is supplied, the system verifies ownership.
3. The system searches only the user's entries.
4. The system gathers each entry's tags.
5. The system returns page items and metadata.

### Alternative flows

- Only unarchived entries are searched by default.
- A status with type `LEARNING` is rejected because learning entries have no status.
- Another user's/missing project or invalid criteria stops the search.

## UC-32 — View technical entry

| Field          | Description                        |
| -------------- | ---------------------------------- |
| Primary actor  | Authenticated user                 |
| Interests      | View an owned entry with its tags. |
| Preconditions  | An entry belonging to the user.    |
| Trigger        | The user selects the entry.        |
| Postconditions | No state change.                   |
| Endpoint       | `GET /api/technical-entry/:id`     |

### Main flow

1. The user specifies the entry.
2. The system verifies ownership.
3. The system gathers the assigned tags.
4. The system returns the entry and tags.

### Alternative flows

- A missing entry or another user's entry is treated as not found.
- Attempts have a separate query and are not included in this response.

## UC-33 — Update technical entry

| Field          | Description                                                           |
| -------------- | --------------------------------------------------------------------- |
| Primary actor  | Authenticated user                                                    |
| Interests      | Correct entry content or association while preserving omitted fields. |
| Preconditions  | An entry belonging to the user.                                       |
| Trigger        | The user provides at least one editable field.                        |
| Postconditions | The title, context, conclusion, and/or project are updated.           |
| Endpoint       | `PATCH /api/technical-entry/:id`                                      |

### Main flow

1. The system finds the user's entry.
2. If a new project is supplied, it verifies that the project is owned and unarchived.
3. The system validates and applies only the submitted fields.
4. The system returns the updated entry.

### Alternative flows

- A request body without an editable field is rejected.
- `projectId: null` unlinks the project and `conclusion: null` removes the conclusion.
- An archived entry can still be updated in the current implementation.
- Changing the conclusion through this endpoint does not change `resolvedAt`.

## UC-34 — Resolve technical issue

| Field          | Description                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------- |
| Primary actor  | Authenticated user                                                                           |
| Interests      | Record the conclusion of an open issue.                                                      |
| Preconditions  | An owned entry of type `ISSUE` with status `OPEN`.                                           |
| Trigger        | The user provides the conclusion.                                                            |
| Postconditions | The conclusion and resolution timestamp are saved atomically; the status becomes `RESOLVED`. |
| Endpoint       | `PATCH /api/technical-entry/:id/resolve`                                                     |

### Main flow

1. The user specifies the issue and its conclusion.
2. The system verifies the type and open state.
3. The system saves the conclusion and resolution timestamp.
4. The system returns the resolved issue.

### Alternative flows

- `LEARNING`, an already resolved issue, or an invalid conclusion prevents the transition.
- An archived entry can still be resolved in the current implementation.

## UC-35 — Reopen technical issue

| Field          | Description                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Primary actor  | Authenticated user                                                                                               |
| Interests      | Resume an issue while preserving its previous history.                                                           |
| Preconditions  | An owned entry of type `ISSUE` with status `RESOLVED`.                                                           |
| Trigger        | The user requests reopening.                                                                                     |
| Postconditions | The resolution timestamp is removed and the status returns to `OPEN`; the conclusion and attempts are preserved. |
| Endpoint       | `PATCH /api/technical-entry/:id/reopen`                                                                          |

### Main flow

1. The system confirms that the entry is a resolved issue belonging to the user.
2. The system removes the resolution timestamp.
3. The system returns the reopened issue.

### Alternative flows

- A `LEARNING` entry or an already open issue cannot be reopened.
- An archived entry can still be reopened in the current implementation.

## UC-36 — Archive technical entry

| Field          | Description                                                |
| -------------- | ---------------------------------------------------------- |
| Primary actor  | Authenticated user                                         |
| Interests      | Remove an entry from default searches without deleting it. |
| Preconditions  | An entry belonging to the user.                            |
| Trigger        | The user requests archiving.                               |
| Postconditions | The entry receives an archive timestamp.                   |
| Endpoint       | `PATCH /api/technical-entry/:id/archive`                   |

### Main flow

1. The system verifies entry ownership.
2. The system records the archive timestamp.
3. The system returns the resulting state.

### Alternative flows

- If already archived, the operation is idempotent.
- There is no restoration use case or endpoint in the current code.

## UC-37 — Delete technical entry

| Field          | Description                                                                        |
| -------------- | ---------------------------------------------------------------------------------- |
| Primary actor  | Authenticated user                                                                 |
| Interests      | Permanently remove an entry and its dependent details.                             |
| Preconditions  | An entry belonging to the user.                                                    |
| Trigger        | The user requests deletion.                                                        |
| Postconditions | The entry, attempts, and tag assignments are deleted; the tags and project remain. |
| Endpoint       | `DELETE /api/technical-entry/:id`                                                  |

### Main flow

1. The system verifies entry ownership.
2. The system deletes the entry and its dependent details.
3. The system confirms without content.

### Alternative flows

- An archived entry can also be deleted.

## UC-38 — Assign tag to entry

| Field          | Description                                              |
| -------------- | -------------------------------------------------------- |
| Primary actor  | Authenticated user                                       |
| Interests      | Classify an entry using an owned tag.                    |
| Preconditions  | The entry and tag belong to the same authenticated user. |
| Trigger        | The user chooses a tag for the entry.                    |
| Postconditions | The entry–tag association exists.                        |
| Endpoint       | `POST /api/technical-entry/:entryId/tags`                |

### Main flow

1. The system verifies ownership of the entry and tag.
2. The system checks the association.
3. If absent, the system creates the association.
4. The system returns the assigned tag.

### Alternative flows

- If the association already exists, the operation is idempotent and only returns the tag.
- An archived entry still accepts tag assignments in the current implementation.

## UC-39 — Remove tag from entry

| Field          | Description                                                |
| -------------- | ---------------------------------------------------------- |
| Primary actor  | Authenticated user                                         |
| Interests      | Remove a classification without deleting the tag or entry. |
| Preconditions  | The entry and tag belong to the user.                      |
| Trigger        | The user requests removal of the association.              |
| Postconditions | The entry–tag association does not exist.                  |
| Endpoint       | `DELETE /api/technical-entry/:entryId/tags/:tagId`         |

### Main flow

1. The system verifies ownership of the entry and tag.
2. If it exists, the system removes the association.
3. The system confirms without content.

### Alternative flows

- An already absent association is treated as an idempotent success.
- An archived entry still accepts tag removal.

## UC-40 — Add solution attempt

| Field          | Description                                            |
| -------------- | ------------------------------------------------------ |
| Primary actor  | Authenticated user                                     |
| Interests      | Document an experiment and its outcome for an issue.   |
| Preconditions  | An owned, unarchived entry of type `ISSUE`.            |
| Trigger        | The user provides a description and outcome.           |
| Postconditions | An attempt becomes part of the entry.                  |
| Endpoint       | `POST /api/technical-entry/:entryId/solution-attempts` |

### Main flow

1. The system verifies the entry's ownership, type, and archive state.
2. The system validates the description and outcome.
3. The system saves and returns the attempt.

### Alternative flows

- `LEARNING`, an archived entry, or invalid data prevents addition.
- An already resolved `ISSUE` can still receive a new attempt if it is not
  archived.

## UC-41 — List solution attempts

| Field          | Description                                                    |
| -------------- | -------------------------------------------------------------- |
| Primary actor  | Authenticated user                                             |
| Interests      | Review an entry's experiments, including filtering by outcome. |
| Preconditions  | An entry belonging to the user.                                |
| Trigger        | The user requests attempts with optional criteria.             |
| Postconditions | No state change.                                               |
| Endpoint       | `GET /api/technical-entry/:entryId/solution-attempts`          |

### Main flow

1. The system verifies entry ownership.
2. The system filters by outcome, paginates, and sorts.
3. The system returns the page of attempts.

### Alternative flows

- An archived entry can still be queried.
- If there are no matches, the page is empty.

## UC-42 — Update solution attempt

| Field          | Description                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| Primary actor  | Authenticated user                                                          |
| Interests      | Correct an attempt's description within the correct entry.                  |
| Preconditions  | An owned entry containing the attempt.                                      |
| Trigger        | The user provides the new description.                                      |
| Postconditions | The description and update timestamp are changed; the outcome is preserved. |
| Endpoint       | `PATCH /api/technical-entry/:entryId/solution-attempts/:attemptId`          |

### Main flow

1. The system verifies entry ownership.
2. The system confirms that the attempt belongs to the specified entry.
3. The system validates and updates the description.
4. The system returns the attempt.

### Alternative flows

- An attempt belonging to another entry is treated as not found.
- An archived entry does not prevent this update in the current code.
- The outcome cannot be edited through this endpoint.

## UC-43 — Remove solution attempt

| Field          | Description                                                         |
| -------------- | ------------------------------------------------------------------- |
| Primary actor  | Authenticated user                                                  |
| Interests      | Remove an attempt recorded for the correct issue.                   |
| Preconditions  | An owned entry containing the attempt.                              |
| Trigger        | The user requests removal.                                          |
| Postconditions | The attempt is deleted; the entry remains.                          |
| Endpoint       | `DELETE /api/technical-entry/:entryId/solution-attempts/:attemptId` |

### Main flow

1. The system verifies entry ownership and the attempt's association.
2. The system deletes the attempt.
3. The system confirms without content.

### Alternative flows

- An attempt outside the entry is treated as not found.
- An archived entry does not prevent this removal in the current code.

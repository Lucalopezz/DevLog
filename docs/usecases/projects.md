# Use cases — projects and their details

Use cases UC-10 through UC-29 are restricted to authenticated users. Whenever a
project or detail does not exist, does not belong to the user, or is not within
the specified project, the API responds with resource not found. This policy
is repeated in alternative flows only when it changes the meaning of the use case.

## UC-10 — Create project

| Field          | Description                                                     |
| -------------- | --------------------------------------------------------------- |
| Primary actor  | Authenticated user                                              |
| Interests      | Record a personal development context.                          |
| Preconditions  | The session account exists.                                     |
| Trigger        | The user provides a name and optional description.              |
| Postconditions | An active, unarchived project belonging to the user is created. |
| Endpoint       | `POST /api/project`                                             |

### Main flow

1. The user provides the project details.
2. The system validates the data and confirms that the user exists.
3. The system checks whether the authenticated user already has a project with
   the same name.
4. The system creates the project with status `ACTIVE`.
5. The system returns the created project.

### Alternative flows

- An invalid name or a missing account prevents creation with `422 Unprocessable
  Entity`.
- A name already used by the same user prevents creation with `409 Conflict`.
- The database also enforces the `(user_id, name)` uniqueness constraint so that
  concurrent requests cannot persist duplicate projects.

## UC-11 — Search projects

| Field          | Description                                       |
| -------------- | ------------------------------------------------- |
| Primary actor  | Authenticated user                                |
| Interests      | Find only the user's own projects.                |
| Preconditions  | Authenticated request.                            |
| Trigger        | The user requests projects with optional filters. |
| Postconditions | No state change.                                  |
| Endpoint       | `GET /api/project`                                |

### Main flow

1. The user provides pagination, sorting, and optional name, status, and
   archive filters.
2. The system restricts the search to the authenticated owner.
3. The system returns the resulting page.

### Alternative flows

- If there are no matches, the page is empty.
- Without an archive filter, both archived and unarchived projects may
  appear.

## UC-12 — View project

| Field          | Description                                 |
| -------------- | ------------------------------------------- |
| Primary actor  | Authenticated user                          |
| Interests      | View an owned project and its technologies. |
| Preconditions  | The project belongs to the user.            |
| Trigger        | The user selects a project.                 |
| Postconditions | No state change.                            |
| Endpoint       | `GET /api/project/:id`                      |

### Main flow

1. The user specifies the project.
2. The system verifies ownership.
3. The system gathers the project's technologies.
4. The system returns the project and its technologies.

### Alternative flows

- A missing project or another user's project is reported as not found.
- Commands, resources, and entries are not included in this response; they have
  separate queries.

## UC-13 — Search project entries

| Field          | Description                                              |
| -------------- | -------------------------------------------------------- |
| Primary actor  | Authenticated user                                       |
| Interests      | View technical entries associated with an owned project. |
| Preconditions  | A project belonging to the user.                         |
| Trigger        | The user requests project entries with optional filters. |
| Postconditions | No state change.                                         |
| Endpoint       | `GET /api/project/:id/technical-entries`                 |

### Main flow

1. The user specifies the project and search criteria.
2. The system verifies project ownership.
3. The system searches for the user's entries associated with the project.
4. The system gathers each entry's tags and returns the page.

### Alternative flows

- A missing/another user's project or a combination of `LEARNING` with a status is rejected.
- Archived entries are excluded by default.

## UC-14 — Update project

| Field          | Description                                           |
| -------------- | ----------------------------------------------------- |
| Primary actor  | Authenticated user                                    |
| Interests      | Change project data while preserving omitted fields.  |
| Preconditions  | An owned, unarchived project.                         |
| Trigger        | The user provides at least one editable field.        |
| Postconditions | The supplied fields and update timestamp are changed. |
| Endpoint       | `PATCH /api/project/:id`                              |

### Main flow

1. The user provides a name, description, status, and/or local path.
2. The system verifies ownership and whether editing is allowed.
3. The system validates and saves only the supplied fields.
4. The system returns the updated project.

### Alternative flows

- A request body without an editable field is rejected.
- `null` removes the description or local path; omission preserves the value.
- An archived project is read-only.

## UC-15 — Archive project

| Field          | Description                                                      |
| -------------- | ---------------------------------------------------------------- |
| Primary actor  | Authenticated user                                               |
| Interests      | Remove a project from current use without deleting its history.  |
| Preconditions  | A project belonging to the user.                                 |
| Trigger        | The user requests archiving.                                     |
| Postconditions | The project receives an archive timestamp and becomes read-only. |
| Endpoint       | `PATCH /api/project/:id/archive`                                 |

### Main flow

1. The user specifies the project.
2. The system verifies ownership and archives it.
3. The system returns the resulting state.

### Alternative flows

- If already archived, the operation is idempotent and preserves timestamps.

## UC-16 — Restore project

| Field          | Description                                                         |
| -------------- | ------------------------------------------------------------------- |
| Primary actor  | Authenticated user                                                  |
| Interests      | Re-enable editing of an archived project.                           |
| Preconditions  | A project belonging to the user.                                    |
| Trigger        | The user requests restoration.                                      |
| Postconditions | The archive timestamp is removed; the previous status is preserved. |
| Endpoint       | `PATCH /api/project/:id/restore`                                    |

### Main flow

1. The user specifies the project.
2. The system verifies ownership and removes the archive timestamp.
3. The system returns the resulting state.

### Alternative flows

- If already unarchived, the operation is idempotent.

## UC-17 — Delete project

| Field          | Description                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Primary actor  | Authenticated user                                                                                           |
| Interests      | Permanently remove a project and its details without deleting technical entries.                             |
| Preconditions  | An owned, unarchived project.                                                                                |
| Trigger        | The user requests deletion.                                                                                  |
| Postconditions | The project, technologies, commands, and resources are deleted; associated entries remain without a project. |
| Endpoint       | `DELETE /api/project/:id`                                                                                    |

### Main flow

1. The user specifies the project.
2. The system verifies ownership and whether modification is allowed.
3. The system deletes the project and its dependent details.
4. The system unlinks the associated technical entries.

### Alternative flows

- An archived project cannot be deleted until it is restored.

## UC-18 — Add project technology

| Field          | Description                                          |
| -------------- | ---------------------------------------------------- |
| Primary actor  | Authenticated user                                   |
| Interests      | Document a technology and its optional version.      |
| Preconditions  | An owned, unarchived project.                        |
| Trigger        | The user provides a name and, optionally, a version. |
| Postconditions | The technology becomes part of the project.          |
| Endpoint       | `POST /api/project/:id/technologies`                 |

### Main flow

1. The user provides the technology.
2. The system confirms that the project can be modified.
3. The system confirms that the name does not already exist in the project.
4. The system saves the technology and returns the resulting project.

### Alternative flows

- A duplicate project technology name or invalid data prevents addition.

## UC-19 — Remove project technology

| Field          | Description                                             |
| -------------- | ------------------------------------------------------- |
| Primary actor  | Authenticated user                                      |
| Interests      | Remove a technology documented in the project.          |
| Preconditions  | An owned, unarchived project containing the technology. |
| Trigger        | The user selects the technology for removal.            |
| Postconditions | The technology is deleted.                              |
| Endpoint       | `DELETE /api/project/:id/technologies/:technologyId`    |

### Main flow

1. The user specifies the project and technology.
2. The system verifies ownership, association, and whether editing is allowed.
3. The system deletes the technology.

### Alternative flows

- A technology belonging to another project is treated as not found.
- There is no endpoint to update a technology; remove and recreate it instead.

## UC-20 — Add project command

| Field          | Description                                                  |
| -------------- | ------------------------------------------------------------ |
| Primary actor  | Authenticated user                                           |
| Interests      | Save a reproducible command with optional context and order. |
| Preconditions  | An owned, unarchived project.                                |
| Trigger        | The user provides a title and command.                       |
| Postconditions | The command becomes part of the project.                     |
| Endpoint       | `POST /api/project/:id/commands`                             |

### Main flow

1. The user provides a title, command, description, and optional order.
2. The system confirms that the project can be modified.
3. The system validates and saves the command.
4. The system returns the created command.

### Alternative flows

- Invalid data or an archived project prevents addition.

## UC-21 — Search project commands

| Field          | Description                            |
| -------------- | -------------------------------------- |
| Primary actor  | Authenticated user                     |
| Interests      | Find commands in an owned project.     |
| Preconditions  | A project belonging to the user.       |
| Trigger        | The user provides optional criteria.   |
| Postconditions | No state change.                       |
| Endpoint       | `GET /api/project/:projectId/commands` |

### Main flow

1. The system verifies project ownership.
2. The system filters by title, command, and/or description, paginates, and sorts.
3. The system returns the page.

### Alternative flows

- An archived project can still be queried.
- If there are no matches, the page is empty.

## UC-22 — View project command

| Field          | Description                                       |
| -------------- | ------------------------------------------------- |
| Primary actor  | Authenticated user                                |
| Interests      | View a specific command in the correct context.   |
| Preconditions  | An owned project containing the command.          |
| Trigger        | The user selects the command.                     |
| Postconditions | No state change.                                  |
| Endpoint       | `GET /api/project/:projectId/commands/:commandId` |

### Main flow

1. The system verifies project ownership.
2. The system confirms that the command belongs to this project.
3. The system returns the command.

### Alternative flows

- An out-of-scope project or command is treated as not found.

## UC-23 — Update project command

| Field          | Description                                          |
| -------------- | ---------------------------------------------------- |
| Primary actor  | Authenticated user                                   |
| Interests      | Correct or enrich an existing command.               |
| Preconditions  | An owned, unarchived project containing the command. |
| Trigger        | The user provides at least one editable field.       |
| Postconditions | The supplied fields are updated.                     |
| Endpoint       | `PATCH /api/project/:projectId/commands/:commandId`  |

### Main flow

1. The system verifies the project and the command's association.
2. The system validates the supplied fields.
3. The system updates and returns the command.

### Alternative flows

- An empty request body is rejected.
- `null` removes the description or order; omitted fields are preserved.

## UC-24 — Remove project command

| Field          | Description                                                    |
| -------------- | -------------------------------------------------------------- |
| Primary actor  | Authenticated user                                             |
| Interests      | Delete a command that should no longer be part of the project. |
| Preconditions  | An owned, unarchived project containing the command.           |
| Trigger        | The user requests removal.                                     |
| Postconditions | The command is deleted.                                        |
| Endpoint       | `DELETE /api/project/:projectId/commands/:commandId`           |

### Main flow

1. The system verifies the project, ownership, and command association.
2. The system deletes the command and confirms without content.

### Alternative flows

- An archived project or a command outside the project prevents removal.

## UC-25 — Add project resource

| Field          | Description                                                                    |
| -------------- | ------------------------------------------------------------------------------ |
| Primary actor  | Authenticated user                                                             |
| Interests      | Save a relevant link classified by type.                                       |
| Preconditions  | An owned, unarchived project.                                                  |
| Trigger        | The user provides a label, URL, and optional type.                             |
| Postconditions | The resource becomes part of the project; an omitted type defaults to `OTHER`. |
| Endpoint       | `POST /api/project/:projectId/resources`                                       |

### Main flow

1. The user provides the resource.
2. The system confirms that the project can be modified.
3. The system validates the URL and saves the resource.
4. The system returns the created resource.

### Alternative flows

- An invalid URL, a URL already used in the same project, or an archived project prevents
  addition.

## UC-26 — Search project resources

| Field          | Description                                |
| -------------- | ------------------------------------------ |
| Primary actor  | Authenticated user                         |
| Interests      | Find links documented in an owned project. |
| Preconditions  | A project belonging to the user.           |
| Trigger        | The user provides optional filters.        |
| Postconditions | No state change.                           |
| Endpoint       | `GET /api/project/:projectId/resources`    |

### Main flow

1. The system verifies project ownership.
2. The system filters by label, URL, and/or type, paginates, and sorts.
3. The system returns the resulting page.

### Alternative flows

- An archived project can still be queried.
- If there are no matches, the page is empty.

## UC-27 — View project resource

| Field          | Description                                         |
| -------------- | --------------------------------------------------- |
| Primary actor  | Authenticated user                                  |
| Interests      | View a specific resource in the correct context.    |
| Preconditions  | An owned project containing the resource.           |
| Trigger        | The user selects the resource.                      |
| Postconditions | No state change.                                    |
| Endpoint       | `GET /api/project/:projectId/resources/:resourceId` |

### Main flow

1. The system verifies project ownership.
2. The system confirms that the resource belongs to this project.
3. The system returns the resource.

### Alternative flows

- An out-of-scope project or resource is treated as not found.

## UC-28 — Update project resource

| Field          | Description                                           |
| -------------- | ----------------------------------------------------- |
| Primary actor  | Authenticated user                                    |
| Interests      | Correct a resource's label, URL, or type.             |
| Preconditions  | An owned, unarchived project containing the resource. |
| Trigger        | The user provides at least one editable field.        |
| Postconditions | The supplied fields are updated.                      |
| Endpoint       | `PATCH /api/project/:projectId/resources/:resourceId` |

### Main flow

1. The system verifies the project and the resource's association.
2. The system validates the supplied fields.
3. The system updates and returns the resource.

### Alternative flows

- An empty request body, invalid URL, or archived project prevents updating.
- This contract's fields do not accept `null` for removal.

## UC-29 — Remove project resource

| Field          | Description                                                 |
| -------------- | ----------------------------------------------------------- |
| Primary actor  | Authenticated user                                          |
| Interests      | Delete a link that should no longer be part of the project. |
| Preconditions  | An owned, unarchived project containing the resource.       |
| Trigger        | The user requests removal.                                  |
| Postconditions | The resource is deleted.                                    |
| Endpoint       | `DELETE /api/project/:projectId/resources/:resourceId`      |

### Main flow

1. The system verifies the project, ownership, and resource association.
2. The system deletes the resource and confirms without content.

### Alternative flows

- An archived project or a resource outside the project prevents removal.

## UC-30 — Search project technologies

| Field          | Description                                                   |
| -------------- | ------------------------------------------------------------- |
| Primary actor  | Authenticated user                                            |
| Interests      | Browse technologies recorded across the user's projects.      |
| Preconditions  | Authenticated request.                                        |
| Trigger        | The user opens the Technologies page with optional filters.   |
| Postconditions | No state change.                                               |
| Endpoint       | `GET /api/project/technologies`                               |

### Main flow

1. The user provides optional technology-name and project filters.
2. The system restricts the search to technologies in the user's projects.
3. The system paginates the result and includes each technology's project name.
4. The system returns the resulting page for grouping by project in the UI.

### Alternative flows

- If there are no matches, the page is empty.
- An unknown or out-of-scope project filter returns an empty page without exposing another user's data.

## UC-44 — Create project environment

| Field | Description |
| --- | --- |
| Primary actor | Authenticated user |
| Interests | Record where a project runs and its runtime conditions. |
| Preconditions | An owned, unarchived project. |
| Trigger | The user submits an environment name, category, and optional details. |
| Postconditions | The environment belongs to the project. |
| Endpoint | `POST /api/project/:projectId/environments` |

### Main flow

1. The system verifies ownership and that the project can be changed.
2. It trims and validates the name and optional details.
3. It saves the environment with a normalized name and returns it with the project name.

### Alternative flows

- Names equal after trimming and case normalization conflict within one project, including under concurrent requests.
- Archived or foreign projects cannot receive environments.
- Environment fields are descriptive; credentials and arbitrary configuration are outside this model.

## UC-45 — List project environments

| Field | Description |
| --- | --- |
| Primary actor | Authenticated user |
| Interests | Review a project's documented environments. |
| Preconditions | An owned project. |
| Trigger | The user opens the Environments tab. |
| Postconditions | No state change. |
| Endpoint | `GET /api/project/:projectId/environments` |

### Main flow

1. The system verifies ownership.
2. It returns a sorted, paginated list, including the project name.

### Alternative flows

- Archived projects remain readable.
- Missing or foreign projects are reported as not found.

## UC-46 — Search owned environments

| Field | Description |
| --- | --- |
| Primary actor | Authenticated user |
| Interests | Find environments across projects. |
| Preconditions | Authenticated request. |
| Trigger | The user opens `/environments` or changes URL filters. |
| Postconditions | No state change. |
| Endpoint | `GET /api/project/environments` |

### Main flow

1. The system restricts records to projects owned by the current user.
2. It optionally searches the name, operating system, and runtime, and filters by category and project.
3. It returns a sorted, paginated result with project names.

### Alternative flows

- A project filter outside the user's scope returns an empty result.
- Archived projects' environments remain in the list.

## UC-47 — Update project environment

| Field | Description |
| --- | --- |
| Primary actor | Authenticated user |
| Interests | Correct an environment's descriptive details. |
| Preconditions | An owned, unarchived project containing the environment. |
| Trigger | The user saves the edit form. |
| Postconditions | Supplied fields are updated. |
| Endpoint | `PATCH /api/project/:projectId/environments/:environmentId` |

### Main flow

1. The system verifies project ownership, lifecycle, and the environment's association.
2. It validates the nonempty partial update and checks name uniqueness.
3. It saves the result and returns it with the project name.

### Alternative flows

- Omitted optional fields are preserved; `null` clears them.
- A duplicate normalized name returns a conflict.
- An environment outside the supplied project is reported as not found.

## UC-48 — Remove project environment

| Field | Description |
| --- | --- |
| Primary actor | Authenticated user |
| Interests | Remove obsolete environment documentation. |
| Preconditions | An owned, unarchived project containing the environment. |
| Trigger | The user confirms deletion. |
| Postconditions | The environment is removed. |
| Endpoint | `DELETE /api/project/:projectId/environments/:environmentId` |

### Main flow

1. The system verifies project ownership, lifecycle, and the environment's association.
2. It deletes the environment and returns no content.

### Alternative flows

- Missing, foreign, or mismatched environments are reported as not found.
- Archived projects cannot have environments removed.

# API and use case traceability

This matrix ensures that every public operation found in the controllers is
represented in the behavioral documentation.

| Method and route                                                    | Use case                                                                                 | Protected |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | :-------: |
| `POST /api/users`                                                   | [UC-01 — Register user](account-and-tags.md#uc-01--register-user)                        |    No     |
| `POST /api/auth/login`                                              | [UC-02 — Authenticate user](account-and-tags.md#uc-02--authenticate-user)                |    No     |
| `POST /api/auth/logout`                                             | [UC-03 — End session](account-and-tags.md#uc-03--end-session)                            |    No     |
| `GET /api/users/me`                                                 | [UC-04 — View current profile](account-and-tags.md#uc-04--view-current-profile)          |    Yes    |
| `PATCH /api/users/me`                                               | [UC-05 — Update profile](account-and-tags.md#uc-05--update-profile)                      |    Yes    |
| `PATCH /api/users/me/password`                                      | [UC-06 — Change password](account-and-tags.md#uc-06--change-password)                    |    Yes    |
| `POST /api/tag`                                                     | [UC-07 — Create tag](account-and-tags.md#uc-07--create-tag)                              |    Yes    |
| `GET /api/tag`                                                      | [UC-08 — Search tags](account-and-tags.md#uc-08--search-tags)                            |    Yes    |
| `DELETE /api/tag/:id`                                               | [UC-09 — Delete tag](account-and-tags.md#uc-09--delete-tag)                              |    Yes    |
| `POST /api/project`                                                 | [UC-10 — Create project](projects.md#uc-10--create-project)                              |    Yes    |
| `GET /api/project`                                                  | [UC-11 — Search projects](projects.md#uc-11--search-projects)                            |    Yes    |
| `GET /api/project/:id`                                              | [UC-12 — View project](projects.md#uc-12--view-project)                                  |    Yes    |
| `GET /api/project/:id/technical-entries`                            | [UC-13 — Search project entries](projects.md#uc-13--search-project-entries)              |    Yes    |
| `PATCH /api/project/:id`                                            | [UC-14 — Update project](projects.md#uc-14--update-project)                              |    Yes    |
| `PATCH /api/project/:id/archive`                                    | [UC-15 — Archive project](projects.md#uc-15--archive-project)                            |    Yes    |
| `PATCH /api/project/:id/restore`                                    | [UC-16 — Restore project](projects.md#uc-16--restore-project)                            |    Yes    |
| `DELETE /api/project/:id`                                           | [UC-17 — Delete project](projects.md#uc-17--delete-project)                              |    Yes    |
| `POST /api/project/:id/technologies`                                | [UC-18 — Add project technology](projects.md#uc-18--add-project-technology)              |    Yes    |
| `DELETE /api/project/:id/technologies/:technologyId`                | [UC-19 — Remove project technology](projects.md#uc-19--remove-project-technology)        |    Yes    |
| `POST /api/project/:id/commands`                                    | [UC-20 — Add project command](projects.md#uc-20--add-project-command)                    |    Yes    |
| `GET /api/project/:projectId/commands`                              | [UC-21 — Search project commands](projects.md#uc-21--search-project-commands)            |    Yes    |
| `GET /api/project/:projectId/commands/:commandId`                   | [UC-22 — View project command](projects.md#uc-22--view-project-command)                  |    Yes    |
| `PATCH /api/project/:projectId/commands/:commandId`                 | [UC-23 — Update project command](projects.md#uc-23--update-project-command)              |    Yes    |
| `DELETE /api/project/:projectId/commands/:commandId`                | [UC-24 — Remove project command](projects.md#uc-24--remove-project-command)              |    Yes    |
| `POST /api/project/:projectId/resources`                            | [UC-25 — Add project resource](projects.md#uc-25--add-project-resource)                  |    Yes    |
| `GET /api/project/:projectId/resources`                             | [UC-26 — Search project resources](projects.md#uc-26--search-project-resources)          |    Yes    |
| `GET /api/project/:projectId/resources/:resourceId`                 | [UC-27 — View project resource](projects.md#uc-27--view-project-resource)                |    Yes    |
| `PATCH /api/project/:projectId/resources/:resourceId`               | [UC-28 — Update project resource](projects.md#uc-28--update-project-resource)            |    Yes    |
| `DELETE /api/project/:projectId/resources/:resourceId`              | [UC-29 — Remove project resource](projects.md#uc-29--remove-project-resource)            |    Yes    |
| `POST /api/technical-entry`                                         | [UC-30 — Create technical entry](technical-entries.md#uc-30--create-technical-entry)     |    Yes    |
| `GET /api/technical-entry`                                          | [UC-31 — Search technical entries](technical-entries.md#uc-31--search-technical-entries) |    Yes    |
| `GET /api/technical-entry/:id`                                      | [UC-32 — View technical entry](technical-entries.md#uc-32--view-technical-entry)         |    Yes    |
| `PATCH /api/technical-entry/:id`                                    | [UC-33 — Update technical entry](technical-entries.md#uc-33--update-technical-entry)     |    Yes    |
| `PATCH /api/technical-entry/:id/resolve`                            | [UC-34 — Resolve technical issue](technical-entries.md#uc-34--resolve-technical-issue)   |    Yes    |
| `PATCH /api/technical-entry/:id/reopen`                             | [UC-35 — Reopen technical issue](technical-entries.md#uc-35--reopen-technical-issue)     |    Yes    |
| `PATCH /api/technical-entry/:id/archive`                            | [UC-36 — Archive technical entry](technical-entries.md#uc-36--archive-technical-entry)   |    Yes    |
| `PATCH /api/technical-entry/:id/restore`                            | [UC-36a — Restore technical entry](technical-entries.md#uc-36a--restore-technical-entry) |    Yes    |
| `DELETE /api/technical-entry/:id`                                   | [UC-37 — Delete technical entry](technical-entries.md#uc-37--delete-technical-entry)     |    Yes    |
| `POST /api/technical-entry/:entryId/tags`                           | [UC-38 — Assign tag to entry](technical-entries.md#uc-38--assign-tag-to-entry)           |    Yes    |
| `DELETE /api/technical-entry/:entryId/tags/:tagId`                  | [UC-39 — Remove tag from entry](technical-entries.md#uc-39--remove-tag-from-entry)       |    Yes    |
| `POST /api/technical-entry/:entryId/solution-attempts`              | [UC-40 — Add solution attempt](technical-entries.md#uc-40--add-solution-attempt)         |    Yes    |
| `GET /api/technical-entry/:entryId/solution-attempts`               | [UC-41 — List solution attempts](technical-entries.md#uc-41--list-solution-attempts)     |    Yes    |
| `PATCH /api/technical-entry/:entryId/solution-attempts/:attemptId`  | [UC-42 — Update solution attempt](technical-entries.md#uc-42--update-solution-attempt)   |    Yes    |
| `DELETE /api/technical-entry/:entryId/solution-attempts/:attemptId` | [UC-43 — Remove solution attempt](technical-entries.md#uc-43--remove-solution-attempt)   |    Yes    |

## Internal elements without their own endpoint

`FindUserByEmailUseCase` exists in the application but is not exposed by a controller;
therefore, it is not modeled as an independent actor goal. It is an internal
service, not a public use case of the current API.

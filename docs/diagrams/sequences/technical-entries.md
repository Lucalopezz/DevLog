# Sequence diagrams — technical entries

## UC-30 — Create technical entry

```mermaid
sequenceDiagram
    autonumber
    actor UserActor as Authenticated user
    participant C as TechnicalEntryController
    participant UC as CreateTechnicalEntryUseCase
    participant URepo as UserRepository
    participant PRepo as ProjectRepository
    participant Entry as TechnicalEntryEntity
    participant ERepo as TechnicalEntryRepository

    UserActor->>C: POST /api/technical-entry
    C->>UC: execute(data, userId)
    UC->>URepo: findById(userId)
    opt project supplied
        UC->>PRepo: findById(projectId)
        alt missing, owned by another user, or archived
            UC-->>UserActor: 404 Project not found
        end
    end
    alt missing user
        UC-->>UserActor: 404 User not found
    else valid dependencies
        UC->>Entry: create(data)
        Entry-->>UC: valid entry or error 422
        UC->>ERepo: insert(entry)
        UC-->>UserActor: entry created
    end
```

## UC-31 and UC-32 — Search and retrieve entries

```mermaid
sequenceDiagram
    autonumber
    actor UserActor as Authenticated user
    participant C as TechnicalEntryController
    participant UC as Query use case
    participant PRepo as ProjectRepository
    participant ERepo as TechnicalEntryRepository
    participant LinkRepo as TechnicalEntryTagRepository

    alt UC-31 search entries
        UserActor->>C: GET /api/technical-entry?filters
        C->>UC: search(userId, filters)
        alt LEARNING type with status
            UC-->>UserActor: 422 learning entries have no status
        else compatible filters
            opt projectId supplied
                UC->>PRepo: findById(projectId)
                PRepo-->>UC: own project or 404
            end
            UC->>ERepo: search(filter includes userId and archivedAt defaulting to null)
            ERepo-->>UC: entry page
            UC->>LinkRepo: findTags(ids, userId)
            LinkRepo-->>UC: grouped tags
            UC-->>UserActor: page with tags
        end
    else UC-32 get entry
        UserActor->>C: GET /api/technical-entry/:id
        C->>UC: get(id, userId)
        UC->>ERepo: findById(id)
        alt missing or belongs to another user
            UC-->>UserActor: 404 Not Found
        else own entry
            UC->>LinkRepo: findTags([id], userId)
            LinkRepo-->>UC: tags
            UC-->>UserActor: entry with tags
        end
    end
```

## UC-33 — Update technical entry

```mermaid
sequenceDiagram
    autonumber
    actor UserActor as Authenticated user
    participant C as TechnicalEntryController
    participant UC as UpdateTechnicalEntryUseCase
    participant ERepo as TechnicalEntryRepository
    participant PRepo as ProjectRepository
    participant Entry as TechnicalEntryEntity

    UserActor->>C: PATCH /api/technical-entry/:id
    C->>UC: execute(id, userId, changes)
    UC->>ERepo: findById(id)
    alt missing or belongs to another user
        UC-->>UserActor: 404 Not Found
    else body without changes
        UC-->>UserActor: 422 Unprocessable Entity
    else update requested
        opt new projectId is a string
            UC->>PRepo: findById(projectId)
            alt project missing, owned by another user, or archived
                UC-->>UserActor: 404 Project not found
            end
        end
        UC->>Entry: update(changes)
        Note over Entry: null clears project/conclusion; omission preserves them
        Entry-->>UC: valid entry or error 422
        UC->>ERepo: update(entry)
        UC-->>UserActor: entry updated
    end
```

## UC-34 through UC-37 — State, archiving, and deletion

```mermaid
sequenceDiagram
    autonumber
    actor UserActor as Authenticated user
    participant C as TechnicalEntryController
    participant UC as Entry use case
    participant ERepo as TechnicalEntryRepository
    participant Entry as TechnicalEntryEntity
    participant DB as Database

    UserActor->>C: PATCH or DELETE /api/technical-entry/:id
    C->>UC: execute(id, userId, conclusion?)
    UC->>ERepo: findById(id)
    alt missing or belongs to another user
        UC-->>UserActor: 404 Not Found
    else UC-34 resolve
        alt not an OPEN ISSUE
            UC-->>UserActor: 422 invalid transition
        else ISSUE OPEN
            UC->>Entry: conclude(conclusion)
            Entry->>Entry: set conclusion, resolvedAt, and updatedAt
            UC->>ERepo: update(entry)
            UC-->>UserActor: RESOLVED entry
        end
    else UC-35 reopen
        UC->>Entry: reopen()
        alt not a RESOLVED ISSUE
            Entry-->>UserActor: 422 invalid transition
        else ISSUE RESOLVED
            Entry->>Entry: clear resolvedAt and preserve history
            UC->>ERepo: update(entry)
            UC-->>UserActor: OPEN entry
        end
    else UC-36 archive
        UC->>Entry: archive()
        Note over Entry: Idempotent when already archived
        UC->>ERepo: update(entry)
        UC-->>UserActor: archived entry
    else UC-37 delete
        UC->>ERepo: delete(id)
        ERepo->>DB: DELETE entry
        DB->>DB: cascade deletion of attempts and assignments
        UC-->>UserActor: 204 No Content
    end
```

## UC-38 and UC-39 — Classify an entry with tags

```mermaid
sequenceDiagram
    autonumber
    actor UserActor as Authenticated user
    participant C as TechnicalEntryController
    participant UC as Assignment use case
    participant ERepo as TechnicalEntryRepository
    participant TRepo as TagRepository
    participant LinkRepo as TechnicalEntryTagRepository

    UserActor->>C: POST or DELETE /api/technical-entry/:entryId/tags
    C->>UC: execute(entryId, tagId, userId)
    UC->>ERepo: findById(entryId)
    UC->>TRepo: findById(tagId)
    alt entry or tag missing or belongs to another user
        UC-->>UserActor: 404 Not Found
    else both belong to the user
        UC->>LinkRepo: exists(entryId, tagId)
        alt UC-38 assign and association missing
            UC->>LinkRepo: add(entryId, tagId)
            UC-->>UserActor: tag assigned
        else UC-38 assign and already exists
            UC-->>UserActor: tag assigned (idempotent)
        else UC-39 remove and exists
            UC->>LinkRepo: remove(entryId, tagId)
            UC-->>UserActor: 204 No Content
        else UC-39 remove and already absent
            UC-->>UserActor: 204 No Content (idempotent)
        end
    end
```

## UC-40 through UC-43 — Solution attempts

```mermaid
sequenceDiagram
    autonumber
    actor UserActor as Authenticated user
    participant C as TechnicalEntryController
    participant UC as Attempt use case
    participant ERepo as TechnicalEntryRepository
    participant Entry as TechnicalEntryEntity
    participant ARepo as SolutionAttemptRepository
    participant Attempt as SolutionAttemptEntity

    UserActor->>C: request to /solution-attempts
    C->>UC: execute(entryId, userId, data?)
    UC->>ERepo: findById(entryId)
    alt entry missing or belongs to another user
        UC-->>UserActor: 404 Not Found
    else UC-40 add
        alt not an ISSUE or archived
            UC-->>UserActor: 422 Unprocessable Entity
        else unarchived ISSUE
            UC->>Entry: addSolutionAttempt(description, result)
            Entry-->>UC: new attempt
            UC->>ARepo: insert(attempt)
            UC-->>UserActor: attempt created
        end
    else UC-41 list
        UC->>ARepo: search(entryId, filters)
        ARepo-->>UC: attempt page
        UC-->>UserActor: page
    else UC-42 update description
        UC->>ARepo: findById(attemptId)
        alt attempt outside entry
            UC-->>UserActor: 404 Not Found
        else linked attempt
            UC->>Attempt: updateDescription(description)
            UC->>ARepo: update(attempt)
            UC-->>UserActor: attempt updated
        end
    else UC-43 remove
        UC->>ARepo: findById(attemptId)
        alt attempt outside entry
            UC-->>UserActor: 404 Not Found
        else linked attempt
            UC->>ARepo: delete(attemptId)
            UC-->>UserActor: 204 No Content
        end
    end
```

The final combined fragment highlights a current asymmetry: only creating an
attempt checks for an unarchived `ISSUE`. Queries, updates,
and removal check ownership and membership, but not archiving.

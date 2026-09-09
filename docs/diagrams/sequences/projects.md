# Sequence diagrams — projects

## UC-10 — Create project

```mermaid
sequenceDiagram
    autonumber
    actor UserActor as Authenticated user
    participant C as ProjectController
    participant UC as CreateProjectUseCase
    participant URepo as UserRepository
    participant Project as ProjectEntity
    participant PRepo as ProjectRepository

    UserActor->>C: POST /api/project
    C->>UC: execute(userId, name, description)
    UC->>URepo: findById(userId)
    alt missing user
        UC-->>UserActor: 404 Not Found
    else existing user
        UC->>Project: create(status ACTIVE)
        Project-->>UC: valid project or error 422
        UC->>PRepo: insert(project)
        UC-->>UserActor: project created
    end
```

## UC-11 through UC-13 — Query projects and their entries

```mermaid
sequenceDiagram
    autonumber
    actor UserActor as Authenticated user
    participant C as ProjectController
    participant UC as Query use case
    participant PRepo as ProjectRepository
    participant TechRepo as ProjectTechnologyRepository
    participant ERepo as TechnicalEntryRepository
    participant LinkRepo as TechnicalEntryTagRepository

    alt UC-11 search projects
        UserActor->>C: GET /api/project?filters
        C->>UC: search(userId, filtros)
        UC->>PRepo: search(filtro inclui userId)
        PRepo-->>UC: project page
        UC-->>UserActor: page
    else UC-12 get project
        UserActor->>C: GET /api/project/:id
        C->>UC: get(id, userId)
        UC->>PRepo: findById(id)
        alt missing project or belongs to another user
            UC-->>UserActor: 404 Not Found
        else own project
            UC->>TechRepo: findByProjectId(id)
            TechRepo-->>UC: technologies
            UC-->>UserActor: project with technologies
        end
    else UC-13 project entries
        UserActor->>C: GET /api/project/:id/technical-entries
        C->>UC: searchEntries(projectId, userId, filtros)
        UC->>PRepo: findById(projectId)
        alt missing project or belongs to another user
            UC-->>UserActor: 404 Not Found
        else own project
            UC->>ERepo: search(userId, projectId, filtros)
            ERepo-->>UC: entry page
            UC->>LinkRepo: findTags(entry IDs, userId)
            LinkRepo-->>UC: tags grouped by entry
            UC-->>UserActor: entry page with tags
        end
    end
```

## UC-14 through UC-17 — Project lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor UserActor as Authenticated user
    participant C as ProjectController
    participant UC as Project use case
    participant PRepo as ProjectRepository
    participant Project as ProjectEntity
    participant DB as Database

    UserActor->>C: PATCH or DELETE /api/project/:id
    C->>UC: execute(id, userId, dados?)
    UC->>PRepo: findById(id)
    alt missing or belongs to another user
        UC-->>UserActor: 404 Not Found
    else UC-14 update
        alt no editable fields
            UC-->>UserActor: 422 Unprocessable Entity
        else has changes
            UC->>Project: update(changes)
            alt archived project
                Project-->>UserActor: 422 read-only
            else editable project
                UC->>PRepo: update(project)
                UC-->>UserActor: project updated
            end
        end
    else UC-15 archive
        UC->>Project: archive()
        Note over Project: Idempotent when already archived
        UC->>PRepo: update(project)
        UC-->>UserActor: archived project
    else UC-16 restore
        UC->>Project: restore()
        Note over Project: Idempotent when already restored
        UC->>PRepo: update(project)
        UC-->>UserActor: project restored
    else UC-17 delete
        UC->>Project: ensureCanBeModified()
        alt archived project
            Project-->>UserActor: 422 read-only
        else editable project
            UC->>PRepo: delete(id)
            PRepo->>DB: DELETE project
            DB->>DB: cascade detail deletion
            DB->>DB: unlink technical entries
            UC-->>UserActor: 204 No Content
        end
    end
```

## UC-18 and UC-19 — Project technologies

```mermaid
sequenceDiagram
    autonumber
    actor UserActor as Authenticated user
    participant C as ProjectController
    participant UC as Technology use case
    participant PRepo as ProjectRepository
    participant TRepo as ProjectTechnologyRepository
    participant Project as ProjectEntity

    alt UC-18 add technology
        UserActor->>C: POST /api/project/:id/technologies
        C->>UC: add(projectId, userId, name, version)
        UC->>PRepo: findById(projectId)
        UC->>TRepo: findByName(projectId, name)
        alt duplicate name
            UC-->>UserActor: 422 Unprocessable Entity
        else available name
            UC->>Project: addTechnology(name, version)
            alt archived project
                Project-->>UserActor: 422 read-only
            else editable project
                Project-->>UC: technology
                UC->>TRepo: insert(technology)
                UC-->>UserActor: project with added technology
            end
        end
    else UC-19 remove technology
        UserActor->>C: DELETE /api/project/:id/technologies/:technologyId
        C->>UC: remove(projectId, technologyId, userId)
        UC->>PRepo: findById(projectId)
        UC->>Project: ensureCanBeModified()
        UC->>TRepo: findById(technologyId)
        alt technology outside project
            UC-->>UserActor: 404 Not Found
        else linked technology
            UC->>TRepo: delete(technologyId)
            UC-->>UserActor: 204 No Content
        end
    end
```

## UC-20 through UC-24 — Project commands

```mermaid
sequenceDiagram
    autonumber
    actor UserActor as Authenticated user
    participant C as ProjectController
    participant UC as Command use case
    participant PRepo as ProjectRepository
    participant CRepo as ProjectCommandRepository
    participant Project as ProjectEntity
    participant Command as ProjectCommandEntity

    UserActor->>C: request to /api/project/:projectId/commands
    C->>UC: execute(dados, projectId, userId)
    UC->>PRepo: findById(projectId)
    alt missing project or belongs to another user
        UC-->>UserActor: 404 Not Found
    else UC-20 add
        UC->>Project: addCommand(dados)
        Project-->>UC: command or error if archived
        UC->>CRepo: insert(command)
        UC-->>UserActor: command created
    else UC-21 pesquisar
        UC->>CRepo: search(projectId, filtros)
        CRepo-->>UC: page
        UC-->>UserActor: command page
    else UC-22 get
        UC->>CRepo: findById(commandId)
        alt command outside project
            UC-->>UserActor: 404 Not Found
        else linked command
            UC-->>UserActor: command
        end
    else UC-23 update
        UC->>Project: ensureCanBeModified()
        UC->>CRepo: findById(commandId)
        alt empty body or invalid link
            UC-->>UserActor: 422 or 404
        else valid update
            UC->>Command: update(changes)
            UC->>CRepo: update(command)
            UC-->>UserActor: command updated
        end
    else UC-24 remove
        UC->>Project: ensureCanBeModified()
        UC->>CRepo: findById(commandId)
        alt command outside project
            UC-->>UserActor: 404 Not Found
        else linked command
            UC->>CRepo: delete(commandId)
            UC-->>UserActor: 204 No Content
        end
    end
```

## UC-25 through UC-29 — Project resources

```mermaid
sequenceDiagram
    autonumber
    actor UserActor as Authenticated user
    participant C as ProjectController
    participant UC as Resource use case
    participant PRepo as ProjectRepository
    participant RRepo as ProjectResourceRepository
    participant Project as ProjectEntity
    participant Resource as ProjectResourceEntity

    UserActor->>C: request to /api/project/:projectId/resources
    C->>UC: execute(dados, projectId, userId)
    UC->>PRepo: findById(projectId)
    alt missing project or belongs to another user
        UC-->>UserActor: 404 Not Found
    else UC-25 add
        UC->>Project: addResource(label, url, type or OTHER)
        Project-->>UC: resource or error if archived
        UC->>RRepo: insert(resource)
        UC-->>UserActor: resource created
    else UC-26 pesquisar
        UC->>RRepo: search(projectId, filtros)
        RRepo-->>UC: page
        UC-->>UserActor: resource page
    else UC-27 get
        UC->>RRepo: findById(resourceId)
        alt resource outside project
            UC-->>UserActor: 404 Not Found
        else linked resource
            UC-->>UserActor: resource
        end
    else UC-28 update
        UC->>Project: ensureCanBeModified()
        UC->>RRepo: findById(resourceId)
        alt empty body or invalid link
            UC-->>UserActor: 422 or 404
        else valid update
            UC->>Resource: update(changes)
            UC->>RRepo: update(resource)
            UC-->>UserActor: resource updated
        end
    else UC-29 remove
        UC->>Project: ensureCanBeModified()
        UC->>RRepo: findById(resourceId)
        alt resource outside project
            UC-->>UserActor: 404 Not Found
        else linked resource
            UC->>RRepo: delete(resourceId)
            UC-->>UserActor: 204 No Content
        end
    end
```

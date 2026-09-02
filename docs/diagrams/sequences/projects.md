# Diagramas de sequência — projetos

## UC-10 — Criar projeto

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário autenticado
    participant C as ProjectController
    participant UC as CreateProjectUseCase
    participant URepo as UserRepository
    participant Project as ProjectEntity
    participant PRepo as ProjectRepository

    Usuario->>C: POST /api/project
    C->>UC: execute(userId, name, description)
    UC->>URepo: findById(userId)
    alt usuário inexistente
        UC-->>Usuario: 404 Not Found
    else usuário existente
        UC->>Project: criar(status ACTIVE)
        Project-->>UC: projeto válido ou erro 422
        UC->>PRepo: insert(projeto)
        UC-->>Usuario: projeto criado
    end
```

## UC-11 a UC-13 — Consultar projetos e seus registros

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário autenticado
    participant C as ProjectController
    participant UC as Caso de uso de consulta
    participant PRepo as ProjectRepository
    participant TechRepo as ProjectTechnologyRepository
    participant ERepo as TechnicalEntryRepository
    participant LinkRepo as TechnicalEntryTagRepository

    alt UC-11 pesquisar projetos
        Usuario->>C: GET /api/project?filtros
        C->>UC: search(userId, filtros)
        UC->>PRepo: search(filtro inclui userId)
        PRepo-->>UC: página de projetos
        UC-->>Usuario: página
    else UC-12 consultar projeto
        Usuario->>C: GET /api/project/:id
        C->>UC: get(id, userId)
        UC->>PRepo: findById(id)
        alt projeto ausente ou alheio
            UC-->>Usuario: 404 Not Found
        else projeto próprio
            UC->>TechRepo: findByProjectId(id)
            TechRepo-->>UC: tecnologias
            UC-->>Usuario: projeto com tecnologias
        end
    else UC-13 registros do projeto
        Usuario->>C: GET /api/project/:id/technical-entries
        C->>UC: searchEntries(projectId, userId, filtros)
        UC->>PRepo: findById(projectId)
        alt projeto ausente ou alheio
            UC-->>Usuario: 404 Not Found
        else projeto próprio
            UC->>ERepo: search(userId, projectId, filtros)
            ERepo-->>UC: página de registros
            UC->>LinkRepo: findTags(ids dos registros, userId)
            LinkRepo-->>UC: tags agrupadas por registro
            UC-->>Usuario: página de registros com tags
        end
    end
```

## UC-14 a UC-17 — Ciclo de vida do projeto

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário autenticado
    participant C as ProjectController
    participant UC as Caso de uso do projeto
    participant PRepo as ProjectRepository
    participant Project as ProjectEntity
    participant DB as Banco de dados

    Usuario->>C: PATCH ou DELETE /api/project/:id
    C->>UC: execute(id, userId, dados?)
    UC->>PRepo: findById(id)
    alt ausente ou de outro usuário
        UC-->>Usuario: 404 Not Found
    else UC-14 atualizar
        alt nenhum campo editável
            UC-->>Usuario: 422 Unprocessable Entity
        else possui alterações
            UC->>Project: update(alterações)
            alt projeto arquivado
                Project-->>Usuario: 422 somente leitura
            else projeto editável
                UC->>PRepo: update(projeto)
                UC-->>Usuario: projeto atualizado
            end
        end
    else UC-15 arquivar
        UC->>Project: archive()
        Note over Project: Idempotente se já arquivado
        UC->>PRepo: update(projeto)
        UC-->>Usuario: projeto arquivado
    else UC-16 restaurar
        UC->>Project: restore()
        Note over Project: Idempotente se já restaurado
        UC->>PRepo: update(projeto)
        UC-->>Usuario: projeto restaurado
    else UC-17 excluir
        UC->>Project: ensureCanBeModified()
        alt projeto arquivado
            Project-->>Usuario: 422 somente leitura
        else projeto editável
            UC->>PRepo: delete(id)
            PRepo->>DB: DELETE projeto
            DB->>DB: excluir detalhes em cascata
            DB->>DB: desvincular registros técnicos
            UC-->>Usuario: 204 No Content
        end
    end
```

## UC-18 e UC-19 — Tecnologias do projeto

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário autenticado
    participant C as ProjectController
    participant UC as Caso de uso de tecnologia
    participant PRepo as ProjectRepository
    participant TRepo as ProjectTechnologyRepository
    participant Project as ProjectEntity

    alt UC-18 adicionar tecnologia
        Usuario->>C: POST /api/project/:id/technologies
        C->>UC: add(projectId, userId, name, version)
        UC->>PRepo: findById(projectId)
        UC->>TRepo: findByName(projectId, name)
        alt nome duplicado
            UC-->>Usuario: 422 Unprocessable Entity
        else nome disponível
            UC->>Project: addTechnology(name, version)
            alt projeto arquivado
                Project-->>Usuario: 422 somente leitura
            else projeto editável
                Project-->>UC: tecnologia
                UC->>TRepo: insert(tecnologia)
                UC-->>Usuario: projeto com tecnologia adicionada
            end
        end
    else UC-19 remover tecnologia
        Usuario->>C: DELETE /api/project/:id/technologies/:technologyId
        C->>UC: remove(projectId, technologyId, userId)
        UC->>PRepo: findById(projectId)
        UC->>Project: ensureCanBeModified()
        UC->>TRepo: findById(technologyId)
        alt tecnologia fora do projeto
            UC-->>Usuario: 404 Not Found
        else tecnologia vinculada
            UC->>TRepo: delete(technologyId)
            UC-->>Usuario: 204 No Content
        end
    end
```

## UC-20 a UC-24 — Comandos do projeto

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário autenticado
    participant C as ProjectController
    participant UC as Caso de uso de comando
    participant PRepo as ProjectRepository
    participant CRepo as ProjectCommandRepository
    participant Project as ProjectEntity
    participant Command as ProjectCommandEntity

    Usuario->>C: requisição em /api/project/:projectId/commands
    C->>UC: execute(dados, projectId, userId)
    UC->>PRepo: findById(projectId)
    alt projeto ausente ou alheio
        UC-->>Usuario: 404 Not Found
    else UC-20 adicionar
        UC->>Project: addCommand(dados)
        Project-->>UC: comando ou erro se arquivado
        UC->>CRepo: insert(comando)
        UC-->>Usuario: comando criado
    else UC-21 pesquisar
        UC->>CRepo: search(projectId, filtros)
        CRepo-->>UC: página
        UC-->>Usuario: página de comandos
    else UC-22 consultar
        UC->>CRepo: findById(commandId)
        alt comando fora do projeto
            UC-->>Usuario: 404 Not Found
        else comando vinculado
            UC-->>Usuario: comando
        end
    else UC-23 atualizar
        UC->>Project: ensureCanBeModified()
        UC->>CRepo: findById(commandId)
        alt corpo vazio ou vínculo inválido
            UC-->>Usuario: 422 ou 404
        else atualização válida
            UC->>Command: update(alterações)
            UC->>CRepo: update(comando)
            UC-->>Usuario: comando atualizado
        end
    else UC-24 remover
        UC->>Project: ensureCanBeModified()
        UC->>CRepo: findById(commandId)
        alt comando fora do projeto
            UC-->>Usuario: 404 Not Found
        else comando vinculado
            UC->>CRepo: delete(commandId)
            UC-->>Usuario: 204 No Content
        end
    end
```

## UC-25 a UC-29 — Recursos do projeto

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário autenticado
    participant C as ProjectController
    participant UC as Caso de uso de recurso
    participant PRepo as ProjectRepository
    participant RRepo as ProjectResourceRepository
    participant Project as ProjectEntity
    participant Resource as ProjectResourceEntity

    Usuario->>C: requisição em /api/project/:projectId/resources
    C->>UC: execute(dados, projectId, userId)
    UC->>PRepo: findById(projectId)
    alt projeto ausente ou alheio
        UC-->>Usuario: 404 Not Found
    else UC-25 adicionar
        UC->>Project: addResource(label, url, type ou OTHER)
        Project-->>UC: recurso ou erro se arquivado
        UC->>RRepo: insert(recurso)
        UC-->>Usuario: recurso criado
    else UC-26 pesquisar
        UC->>RRepo: search(projectId, filtros)
        RRepo-->>UC: página
        UC-->>Usuario: página de recursos
    else UC-27 consultar
        UC->>RRepo: findById(resourceId)
        alt recurso fora do projeto
            UC-->>Usuario: 404 Not Found
        else recurso vinculado
            UC-->>Usuario: recurso
        end
    else UC-28 atualizar
        UC->>Project: ensureCanBeModified()
        UC->>RRepo: findById(resourceId)
        alt corpo vazio ou vínculo inválido
            UC-->>Usuario: 422 ou 404
        else atualização válida
            UC->>Resource: update(alterações)
            UC->>RRepo: update(recurso)
            UC-->>Usuario: recurso atualizado
        end
    else UC-29 remover
        UC->>Project: ensureCanBeModified()
        UC->>RRepo: findById(resourceId)
        alt recurso fora do projeto
            UC-->>Usuario: 404 Not Found
        else recurso vinculado
            UC->>RRepo: delete(resourceId)
            UC-->>Usuario: 204 No Content
        end
    end
```

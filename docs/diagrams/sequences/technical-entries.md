# Diagramas de sequência — registros técnicos

## UC-30 — Criar registro técnico

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário autenticado
    participant C as TechnicalEntryController
    participant UC as CreateTechnicalEntryUseCase
    participant URepo as UserRepository
    participant PRepo as ProjectRepository
    participant Entry as TechnicalEntryEntity
    participant ERepo as TechnicalEntryRepository

    Usuario->>C: POST /api/technical-entry
    C->>UC: execute(dados, userId)
    UC->>URepo: findById(userId)
    opt projeto informado
        UC->>PRepo: findById(projectId)
        alt ausente, alheio ou arquivado
            UC-->>Usuario: 404 Projeto não encontrado
        end
    end
    alt usuário inexistente
        UC-->>Usuario: 404 Usuário não encontrado
    else dependências válidas
        UC->>Entry: criar(dados)
        Entry-->>UC: entrada válida ou erro 422
        UC->>ERepo: insert(entrada)
        UC-->>Usuario: registro criado
    end
```

## UC-31 e UC-32 — Pesquisar e consultar registros

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário autenticado
    participant C as TechnicalEntryController
    participant UC as Caso de uso de consulta
    participant PRepo as ProjectRepository
    participant ERepo as TechnicalEntryRepository
    participant LinkRepo as TechnicalEntryTagRepository

    alt UC-31 pesquisar registros
        Usuario->>C: GET /api/technical-entry?filtros
        C->>UC: search(userId, filtros)
        alt tipo LEARNING com status
            UC-->>Usuario: 422 sem status para aprendizado
        else filtros compatíveis
            opt projectId informado
                UC->>PRepo: findById(projectId)
                PRepo-->>UC: projeto próprio ou 404
            end
            UC->>ERepo: search(filtro inclui userId e archivedAt padrão null)
            ERepo-->>UC: página de registros
            UC->>LinkRepo: findTags(ids, userId)
            LinkRepo-->>UC: tags agrupadas
            UC-->>Usuario: página com tags
        end
    else UC-32 consultar registro
        Usuario->>C: GET /api/technical-entry/:id
        C->>UC: get(id, userId)
        UC->>ERepo: findById(id)
        alt ausente ou alheio
            UC-->>Usuario: 404 Not Found
        else registro próprio
            UC->>LinkRepo: findTags([id], userId)
            LinkRepo-->>UC: tags
            UC-->>Usuario: registro com tags
        end
    end
```

## UC-33 — Atualizar registro técnico

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário autenticado
    participant C as TechnicalEntryController
    participant UC as UpdateTechnicalEntryUseCase
    participant ERepo as TechnicalEntryRepository
    participant PRepo as ProjectRepository
    participant Entry as TechnicalEntryEntity

    Usuario->>C: PATCH /api/technical-entry/:id
    C->>UC: execute(id, userId, alterações)
    UC->>ERepo: findById(id)
    alt ausente ou alheio
        UC-->>Usuario: 404 Not Found
    else corpo sem alteração
        UC-->>Usuario: 422 Unprocessable Entity
    else atualização solicitada
        opt novo projectId é string
            UC->>PRepo: findById(projectId)
            alt projeto ausente, alheio ou arquivado
                UC-->>Usuario: 404 Projeto não encontrado
            end
        end
        UC->>Entry: update(alterações)
        Note over Entry: null remove projeto/conclusão; ausente preserva
        Entry-->>UC: entrada válida ou erro 422
        UC->>ERepo: update(entrada)
        UC-->>Usuario: registro atualizado
    end
```

## UC-34 a UC-37 — Estado, arquivamento e exclusão

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário autenticado
    participant C as TechnicalEntryController
    participant UC as Caso de uso do registro
    participant ERepo as TechnicalEntryRepository
    participant Entry as TechnicalEntryEntity
    participant DB as Banco de dados

    Usuario->>C: PATCH ou DELETE /api/technical-entry/:id
    C->>UC: execute(id, userId, conclusion?)
    UC->>ERepo: findById(id)
    alt ausente ou alheio
        UC-->>Usuario: 404 Not Found
    else UC-34 resolver
        alt não é ISSUE OPEN
            UC-->>Usuario: 422 transição inválida
        else ISSUE OPEN
            UC->>Entry: conclude(conclusion)
            Entry->>Entry: definir conclusion, resolvedAt e updatedAt
            UC->>ERepo: update(entrada)
            UC-->>Usuario: registro RESOLVED
        end
    else UC-35 reabrir
        UC->>Entry: reopen()
        alt não é ISSUE RESOLVED
            Entry-->>Usuario: 422 transição inválida
        else ISSUE RESOLVED
            Entry->>Entry: remover resolvedAt e preservar histórico
            UC->>ERepo: update(entrada)
            UC-->>Usuario: registro OPEN
        end
    else UC-36 arquivar
        UC->>Entry: archive()
        Note over Entry: Idempotente se já arquivado
        UC->>ERepo: update(entrada)
        UC-->>Usuario: registro arquivado
    else UC-37 excluir
        UC->>ERepo: delete(id)
        ERepo->>DB: DELETE registro
        DB->>DB: excluir tentativas e atribuições em cascata
        UC-->>Usuario: 204 No Content
    end
```

## UC-38 e UC-39 — Classificar registro com tags

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário autenticado
    participant C as TechnicalEntryController
    participant UC as Caso de uso de atribuição
    participant ERepo as TechnicalEntryRepository
    participant TRepo as TagRepository
    participant LinkRepo as TechnicalEntryTagRepository

    Usuario->>C: POST ou DELETE /api/technical-entry/:entryId/tags
    C->>UC: execute(entryId, tagId, userId)
    UC->>ERepo: findById(entryId)
    UC->>TRepo: findById(tagId)
    alt registro ou tag ausente/alheio
        UC-->>Usuario: 404 Not Found
    else ambos pertencem ao usuário
        UC->>LinkRepo: exists(entryId, tagId)
        alt UC-38 atribuir e associação ausente
            UC->>LinkRepo: add(entryId, tagId)
            UC-->>Usuario: tag atribuída
        else UC-38 atribuir e já existe
            UC-->>Usuario: tag atribuída (idempotente)
        else UC-39 remover e existe
            UC->>LinkRepo: remove(entryId, tagId)
            UC-->>Usuario: 204 No Content
        else UC-39 remover e já não existe
            UC-->>Usuario: 204 No Content (idempotente)
        end
    end
```

## UC-40 a UC-43 — Tentativas de solução

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário autenticado
    participant C as TechnicalEntryController
    participant UC as Caso de uso de tentativa
    participant ERepo as TechnicalEntryRepository
    participant Entry as TechnicalEntryEntity
    participant ARepo as SolutionAttemptRepository
    participant Attempt as SolutionAttemptEntity

    Usuario->>C: requisição em /solution-attempts
    C->>UC: execute(entryId, userId, dados?)
    UC->>ERepo: findById(entryId)
    alt registro ausente ou alheio
        UC-->>Usuario: 404 Not Found
    else UC-40 adicionar
        alt não é ISSUE ou está arquivado
            UC-->>Usuario: 422 Unprocessable Entity
        else ISSUE não arquivado
            UC->>Entry: addSolutionAttempt(description, result)
            Entry-->>UC: nova tentativa
            UC->>ARepo: insert(tentativa)
            UC-->>Usuario: tentativa criada
        end
    else UC-41 listar
        UC->>ARepo: search(entryId, filtros)
        ARepo-->>UC: página de tentativas
        UC-->>Usuario: página
    else UC-42 atualizar descrição
        UC->>ARepo: findById(attemptId)
        alt tentativa fora do registro
            UC-->>Usuario: 404 Not Found
        else tentativa vinculada
            UC->>Attempt: updateDescription(description)
            UC->>ARepo: update(tentativa)
            UC-->>Usuario: tentativa atualizada
        end
    else UC-43 remover
        UC->>ARepo: findById(attemptId)
        alt tentativa fora do registro
            UC-->>Usuario: 404 Not Found
        else tentativa vinculada
            UC->>ARepo: delete(attemptId)
            UC-->>Usuario: 204 No Content
        end
    end
```

O fragmento combinado final evidencia uma assimetria atual: só a criação de
tentativa verifica se o registro é `ISSUE` não arquivado. Consulta, atualização
e remoção verificam propriedade e vínculo, mas não o arquivamento.

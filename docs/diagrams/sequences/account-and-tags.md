# Diagramas de sequência — conta, autenticação e tags

Os diagramas mostram responsabilidades, não cada linha de código. Validação
global de DTO e serialização aparecem somente quando relevantes ao fluxo.

## UC-01 — Cadastrar usuário

```mermaid
sequenceDiagram
    autonumber
    actor Visitante
    participant C as UserController
    participant UC as CreateUserUseCase
    participant URepo as UserRepository
    participant Hash as HashProvider
    participant User as UserEntity

    Visitante->>C: POST /api/users
    C->>UC: execute(dados)
    alt senhas diferentes
        UC-->>C: erro 422
        C-->>Visitante: senhas não conferem
    else senhas iguais
        UC->>URepo: findByEmail(email)
        alt e-mail já cadastrado
            URepo-->>UC: usuário
            UC-->>Visitante: erro 409
        else e-mail disponível
            URepo-->>UC: null
            UC->>Hash: generateHash(password)
            Hash-->>UC: passwordHash
            UC->>User: criar(dados, passwordHash)
            User-->>UC: usuário válido
            UC->>URepo: insert(usuário)
            UC-->>C: dados públicos
            C-->>Visitante: usuário criado
        end
    end
```

## UC-02 — Autenticar usuário

```mermaid
sequenceDiagram
    autonumber
    actor Visitante
    participant C as AuthController
    participant UC as AuthenticateUserUseCase
    participant URepo as UserRepository
    participant Hash as HashProvider
    participant Token as TokenProvider
    participant Browser as Navegador

    Visitante->>C: POST /api/auth/login
    C->>UC: execute(email, password)
    UC->>URepo: findByEmail(email)
    URepo-->>UC: usuário ou null
    opt usuário encontrado
        UC->>Hash: compareHash(password, passwordHash)
        Hash-->>UC: corresponde?
    end
    alt credenciais inválidas
        UC-->>Visitante: erro 401 genérico
    else credenciais válidas
        UC->>Token: generate(sub = user.id)
        Token-->>UC: JWT
        UC-->>C: token e usuário
        C->>Browser: Set-Cookie access_token (HttpOnly)
        C-->>Visitante: dados públicos do usuário
    end
```

## Autenticar uma requisição protegida

Esta interação é uma pré-condição comum aos casos UC-04 a UC-43.

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário
    participant Guard as AuthGuard
    participant Token as TokenProvider
    participant C as Controller protegido

    Usuario->>Guard: requisição com cookies
    alt cookie ausente
        Guard-->>Usuario: 401 Unauthorized
    else cookie presente
        Guard->>Token: verify(access_token)
        alt token inválido ou sem subject
            Token-->>Guard: falha
            Guard-->>Usuario: 401 Unauthorized
        else token válido
            Token-->>Guard: payload com userId
            Guard->>C: autorizar e anexar usuário
            C-->>Usuario: continua o caso específico
        end
    end
```

## UC-03 — Encerrar sessão

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Visitante ou usuário
    participant C as AuthController
    participant Browser as Navegador

    Usuario->>C: POST /api/auth/logout
    C->>Browser: Clear-Cookie access_token
    C-->>Usuario: 204 No Content
    Note over C,Browser: Não há lista de revogação no servidor
```

## UC-04 a UC-06 — Gerenciar o próprio perfil

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário autenticado
    participant C as UserController
    participant UC as Caso de uso de usuário
    participant URepo as UserRepository
    participant Hash as HashProvider
    participant User as UserEntity

    alt UC-04 consultar perfil
        Usuario->>C: GET /api/users/me
        C->>UC: getCurrentUser(userId)
        UC->>URepo: findById(userId)
        URepo-->>UC: usuário ou null
        UC-->>Usuario: perfil ou 404
    else UC-05 atualizar nome
        Usuario->>C: PATCH /api/users/me
        C->>UC: update(userId, name)
        UC->>URepo: findById(userId)
        UC->>User: updateName(name)
        User-->>UC: válido ou erro 422
        UC->>URepo: update(usuário)
        UC-->>Usuario: perfil atualizado
    else UC-06 alterar senha
        Usuario->>C: PATCH /api/users/me/password
        C->>UC: updatePassword(dados)
        UC->>URepo: findById(userId)
        alt confirmação diverge
            UC-->>Usuario: erro 422
        else confirmação coincide
            UC->>Hash: compareHash(currentPassword, hash)
            alt senha atual inválida
                UC-->>Usuario: erro 422
            else senha atual válida
                UC->>Hash: generateHash(newPassword)
                Hash-->>UC: novo hash
                UC->>User: updatePassword(hash)
                UC->>URepo: update(usuário)
                UC-->>Usuario: perfil atualizado
            end
        end
    end
```

## UC-07 a UC-09 — Gerenciar tags

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário autenticado
    participant C as TagController
    participant UC as Caso de uso de tag
    participant URepo as UserRepository
    participant Tag as TagEntity
    participant TRepo as TagRepository
    participant DB as Banco de dados

    alt UC-07 criar tag
        Usuario->>C: POST /api/tag
        C->>UC: create(name, userId)
        UC->>URepo: findById(userId)
        UC->>Tag: criar e normalizar nome
        UC->>TRepo: findByNormalizedName(name, userId)
        alt duplicada
            UC-->>Usuario: 409 Conflict
        else disponível
            UC->>TRepo: insert(tag)
            TRepo->>DB: INSERT
            UC-->>Usuario: tag criada
        end
    else UC-08 pesquisar tags
        Usuario->>C: GET /api/tag?filtros
        C->>UC: search(userId, filtros)
        UC->>TRepo: search(filtro sempre inclui userId)
        TRepo->>DB: COUNT e SELECT paginados
        DB-->>Usuario: página de tags
    else UC-09 excluir tag
        Usuario->>C: DELETE /api/tag/:id
        C->>UC: delete(id, userId)
        UC->>TRepo: findById(id)
        alt ausente ou de outro usuário
            UC-->>Usuario: 404 Not Found
        else tag própria
            UC->>TRepo: delete(id)
            TRepo->>DB: DELETE tag e vínculos em cascata
            UC-->>Usuario: 204 No Content
        end
    end
```

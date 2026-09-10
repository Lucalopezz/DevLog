# Sequence diagrams — account, authentication, and tags

Diagrams show responsibilities, not every line of code. Global DTO validation
and serialization appear only when relevant to the flow.

## UC-01 — Register user

```mermaid
sequenceDiagram
    autonumber
    actor Guest
    participant C as UserController
    participant UC as CreateUserUseCase
    participant URepo as UserRepository
    participant Hash as HashProvider
    participant User as UserEntity

    Guest->>C: POST /api/users
    C->>UC: execute(data)
    alt passwords differ
        UC-->>C: error 422
        C-->>Guest: passwords do not match
    else passwords match
        UC->>URepo: findByEmail(email)
        alt email already registered
            URepo-->>UC: user
            UC-->>Guest: error 409
        else email available
            URepo-->>UC: null
            UC->>Hash: generateHash(password)
            Hash-->>UC: passwordHash
            UC->>User: create(data, passwordHash)
            User-->>UC: valid user
            UC->>URepo: insert(user)
            UC-->>C: public data
            C-->>Guest: user created
        end
    end
```

## UC-02 — Authenticate user

```mermaid
sequenceDiagram
    autonumber
    actor Guest
    participant C as AuthController
    participant UC as AuthenticateUserUseCase
    participant URepo as UserRepository
    participant Hash as HashProvider
    participant Token as TokenProvider
    participant Browser as Browser

    Guest->>C: POST /api/auth/login
    C->>UC: execute(email, password)
    UC->>URepo: findByEmail(email)
    URepo-->>UC: user or null
    opt user found
        UC->>Hash: compareHash(password, passwordHash)
        Hash-->>UC: matches?
    end
    alt invalid credentials
        UC-->>Guest: generic 401 error
    else valid credentials
        UC->>Token: generate(sub = user.id)
        Token-->>UC: JWT
        UC-->>C: token and user
        C->>Browser: Set-Cookie access_token (HttpOnly)
        C-->>Guest: public user data
    end
```

## Authenticate a protected request

This interaction is a shared precondition for UC-04 through UC-43.

```mermaid
sequenceDiagram
    autonumber
    actor UserActor as User
    participant Guard as AuthGuard
    participant Token as TokenProvider
    participant C as Protected controller

    UserActor->>Guard: request with cookies
    alt missing cookie
        Guard-->>UserActor: 401 Unauthorized
    else present cookie
        Guard->>Token: verify(access_token)
        alt invalid token or missing subject
            Token-->>Guard: failure
            Guard-->>UserActor: 401 Unauthorized
        else valid token
            Token-->>Guard: payload with userId
            Guard->>C: authorize and attach user
            C-->>UserActor: continue the specific use case
        end
    end
```

## UC-03 — End session

```mermaid
sequenceDiagram
    autonumber
    actor UserActor as Guest or user
    participant C as AuthController
    participant Browser as Browser

    UserActor->>C: POST /api/auth/logout
    C->>Browser: Clear-Cookie access_token
    C-->>UserActor: 204 No Content
    Note over C,Browser: No server-side revocation list
```

## UC-04 through UC-06 — Manage own profile

```mermaid
sequenceDiagram
    autonumber
    actor UserActor as Authenticated user
    participant C as UserController
    participant UC as User use case
    participant URepo as UserRepository
    participant Hash as HashProvider
    participant User as UserEntity

    alt UC-04 get profile
        UserActor->>C: GET /api/users/me
        C->>UC: getCurrentUser(userId)
        UC->>URepo: findById(userId)
        URepo-->>UC: user or null
        UC-->>UserActor: profile or 404
    else UC-05 update name
        UserActor->>C: PATCH /api/users/me
        C->>UC: update(userId, name)
        UC->>URepo: findById(userId)
        UC->>User: updateName(name)
        User-->>UC: valid or error 422
        UC->>URepo: update(user)
        UC-->>UserActor: profile updated
    else UC-06 change password
        UserActor->>C: PATCH /api/users/me/password
        C->>UC: updatePassword(data)
        UC->>URepo: findById(userId)
        alt confirmation differs
            UC-->>UserActor: error 422
        else confirmation matches
            UC->>Hash: compareHash(currentPassword, hash)
            alt invalid current password
                UC-->>UserActor: error 422
            else valid current password
                UC->>Hash: generateHash(newPassword)
                Hash-->>UC: new hash
                UC->>User: updatePassword(hash)
                UC->>URepo: update(user)
                UC-->>UserActor: profile updated
            end
        end
    end
```

## UC-07 through UC-09 — Manage tags

```mermaid
sequenceDiagram
    autonumber
    actor UserActor as Authenticated user
    participant C as TagController
    participant UC as Tag use case
    participant URepo as UserRepository
    participant Tag as TagEntity
    participant TRepo as TagRepository
    participant DB as Database

    alt UC-07 create tag
        UserActor->>C: POST /api/tag
        C->>UC: create(name, userId)
        UC->>URepo: findById(userId)
        UC->>Tag: create and normalize name
        UC->>TRepo: findByNormalizedName(name, userId)
        alt duplicate
            UC-->>UserActor: 409 Conflict
        else available
            UC->>TRepo: insert(tag)
            TRepo->>DB: INSERT
            UC-->>UserActor: tag created
        end
    else UC-08 search tags
        UserActor->>C: GET /api/tag?filters
        C->>UC: search(userId, filters)
        UC->>TRepo: search(filter always includes userId)
        TRepo->>DB: paginated COUNT and SELECT
        DB-->>UserActor: tag page
    else UC-09 delete tag
        UserActor->>C: DELETE /api/tag/:id
        C->>UC: delete(id, userId)
        UC->>TRepo: findById(id)
        alt missing or belongs to another user
            UC-->>UserActor: 404 Not Found
        else own tag
            UC->>TRepo: delete(id)
            TRepo->>DB: DELETE tag and cascade links
            UC-->>UserActor: 204 No Content
        end
    end
```

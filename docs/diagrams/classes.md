# Class diagrams

## Domain model

This is the main diagram for studying UML. It prioritizes business
concepts and omits getters, setters, DTOs, presenters, and ORM details. Attributes
with `?` are optional; attributes followed by `/` are derived.

```mermaid
classDiagram
direction LR

class Entity {
  <<abstract>>
  -id: UUID
}

class User {
  -name: string
  -email: string
  -passwordHash: string
  -createdAt: Date
  -updatedAt: Date
  +updateName(name): void
  +updatePassword(hash): void
}

class Project {
  -userId: UUID
  -name: string
  -description: string?
  -status: ProjectStatus
  -localPath: string?
  -archivedAt: Date?
  -createdAt: Date
  -updatedAt: Date
  +addTechnology(name, version): ProjectTechnology
  +addCommand(title, command, description, order): ProjectCommand
  +addResource(label, url, type): ProjectResource
  +update(changes): void
  +archive(): void
  +restore(): void
  +ensureCanBeModified(): void
}

class ProjectTechnology {
  -projectId: UUID
  -name: string
  -version: string?
  -createdAt: Date
  -updatedAt: Date
}

class ProjectCommand {
  -projectId: UUID
  -title: string
  -command: string
  -description: string?
  -executionOrder: number?
  -createdAt: Date
  -updatedAt: Date
  +update(changes): void
}

class ProjectResource {
  -projectId: UUID
  -label: string
  -url: string
  -type: ProjectResourceType
  -createdAt: Date
  -updatedAt: Date
  +update(changes): void
}

class TechnicalEntry {
  -userId: UUID
  -projectId: UUID?
  -title: string
  -context: string
  -conclusion: string?
  -type: TechnicalEntryType
  -resolvedAt: Date?
  -archivedAt: Date?
  -createdAt: Date
  -updatedAt: Date
  +status(): TechnicalEntryStatus?
  +update(changes): void
  +linkProject(projectId): void
  +addSolutionAttempt(description, result): SolutionAttempt
  +conclude(conclusion): void
  +reopen(): void
  +archive(): void
}

class SolutionAttempt {
  -technicalEntryId: UUID
  -description: string
  -result: SolutionAttemptResult
  -createdAt: Date
  -updatedAt: Date
  +updateDescription(description): void
}

class Tag {
  -userId: UUID
  -name: string
  -normalizedName: string
  -createdAt: Date
  -updatedAt: Date
}

class TagName {
  <<value object>>
  +normalize(name): string
}

class TechnicalEntryTag {
  <<association class>>
  -technicalEntryId: UUID
  -tagId: UUID
  -createdAt: Date
}

class ProjectStatus {
  <<enumeration>>
  ACTIVE
  INACTIVE
  FINISHED
}

class TechnicalEntryType {
  <<enumeration>>
  ISSUE
  LEARNING
}

class TechnicalEntryStatus {
  <<enumeration>>
  OPEN
  RESOLVED
}

class SolutionAttemptResult {
  <<enumeration>>
  FAILED
  PARTIAL
  SUCCESSFUL
}

class ProjectResourceType {
  <<enumeration>>
  REPOSITORY
  DOCUMENTATION
  LOCAL_URL
  EXTERNAL_URL
  OTHER
}

Entity <|-- User
Entity <|-- Project
Entity <|-- ProjectTechnology
Entity <|-- ProjectCommand
Entity <|-- ProjectResource
Entity <|-- TechnicalEntry
Entity <|-- SolutionAttempt
Entity <|-- Tag

User "1" -- "0..*" Project : possui
User "1" -- "0..*" TechnicalEntry : possui
User "1" -- "0..*" Tag : possui

Project "1" *-- "0..*" ProjectTechnology : composes
Project "1" *-- "0..*" ProjectCommand : composes
Project "1" *-- "0..*" ProjectResource : composes
Project "0..1" <-- "0..*" TechnicalEntry : contextualiza
TechnicalEntry "1" *-- "0..*" SolutionAttempt : composes

TechnicalEntry "1" -- "0..*" TechnicalEntryTag : participa
Tag "1" -- "0..*" TechnicalEntryTag : participa
Tag ..> TagName : normalizes with

Project --> ProjectStatus
ProjectResource --> ProjectResourceType
TechnicalEntry --> TechnicalEntryType
TechnicalEntry ..> TechnicalEntryStatus : deriva
SolutionAttempt --> SolutionAttemptResult
```

### Reading the relationships

- `Project` composes technologies, commands, and resources because these objects
  are created within a project, have no meaning without it, and are deleted
  in a cascade.
- `TechnicalEntry` composes `SolutionAttempt` through the same lifecycle relationship.
- `TechnicalEntry` only associates with `Project`: the link is optional, and when
  the project is deleted, the entry survives with an empty `projectId`.
- `TechnicalEntryTag` materializes the many-to-many association and stores
  the assignment date. Mermaid has no native association class notation,
  so the stereotype makes its role explicit.
- `User` has ownership associations rather than domain composition.
  Although the database cascades user deletion, these objects are
  aggregates handled by their own use cases and repositories.

## Technical layer view

This second diagram does not replace the domain model. It shows the
architectural pattern repeated across NestJS modules and explains why controllers,
use cases, and repositories are not business classes in the diagram above.

```mermaid
classDiagram
direction LR

class AuthGuard {
  +canActivate(context): boolean
}
class Controller {
  <<Nest controller>>
  +handle(request): response
}
class UseCase {
  <<application>>
  +execute(input): output
}
class DomainEntity {
  <<domain>>
  +applyBusinessRule(): void
}
class Repository {
  <<interface>>
  +findById(id): Entity?
  +insert(entity): void
  +update(entity): void
  +delete(id): void
}
class PrismaRepository {
  <<infrastructure>>
}
class PrismaService {
  <<database adapter>>
}
class Presenter {
  <<infrastructure>>
  +toResponse(output): response
}
class TokenProvider {
  <<interface>>
  +generate(payload): token
  +verify(token): payload
}
class JwtTokenService {
  <<infrastructure>>
}
class HashProvider {
  <<interface>>
  +generateHash(value): hash
  +compareHash(value, hash): boolean
}
class BcryptjsHashProvider {
  <<infrastructure>>
}

Controller --> AuthGuard : protects route
Controller --> UseCase : executa
Controller --> Presenter : formats output
UseCase --> Repository : depends on abstraction
UseCase --> DomainEntity : coordena
PrismaRepository ..|> Repository
PrismaRepository --> PrismaService
JwtTokenService ..|> TokenProvider
BcryptjsHashProvider ..|> HashProvider
AuthGuard --> TokenProvider
UseCase --> TokenProvider : authentication
UseCase --> HashProvider : credenciais
```

The central principle is **dependency inversion**: the application knows
repository and provider contracts; Prisma, JWT, and bcrypt implementations
live in infrastructure. This allows testing use cases with doubles without
loading a database or HTTP server.

## Project state mapping

The domain and API use `ACTIVE`, `INACTIVE`, and `FINISHED`. The
Prisma/PostgreSQL enum uses `ACTIVE`, `PAUSED`, and `FINISHED`.
`ProjectModelMapper` translates `INACTIVE` ↔ `PAUSED`; this is not
inheritance or two simultaneous states, but a translation boundary between
modelos.

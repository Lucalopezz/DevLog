# Diagramas de classes

## Modelo de domínio

Este é o diagrama principal para estudo de UML. Ele prioriza conceitos do
negócio e omite getters, setters, DTOs, presenters e detalhes do ORM. Atributos
com `?` são opcionais; atributos seguidos de `/` são derivados.

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

Project "1" *-- "0..*" ProjectTechnology : compõe
Project "1" *-- "0..*" ProjectCommand : compõe
Project "1" *-- "0..*" ProjectResource : compõe
Project "0..1" <-- "0..*" TechnicalEntry : contextualiza
TechnicalEntry "1" *-- "0..*" SolutionAttempt : compõe

TechnicalEntry "1" -- "0..*" TechnicalEntryTag : participa
Tag "1" -- "0..*" TechnicalEntryTag : participa
Tag ..> TagName : normaliza com

Project --> ProjectStatus
ProjectResource --> ProjectResourceType
TechnicalEntry --> TechnicalEntryType
TechnicalEntry ..> TechnicalEntryStatus : deriva
SolutionAttempt --> SolutionAttemptResult
```

### Leitura dos relacionamentos

- `Project` compõe tecnologia, comando e recurso porque esses objetos são
  criados dentro de um projeto, não fazem sentido sem ele e são excluídos em
  cascata.
- `TechnicalEntry` compõe `SolutionAttempt` pela mesma relação de ciclo de vida.
- `TechnicalEntry` apenas se associa a `Project`: o vínculo é opcional e, ao
  excluir o projeto, a entrada sobrevive com `projectId` vazio.
- `TechnicalEntryTag` materializa a associação muitos-para-muitos e guarda a
  data da atribuição. O Mermaid não possui notação nativa de “association
  class”, então o estereótipo explicita seu papel.
- `User` aparece com associações de propriedade, não como composição do modelo
  de domínio. Embora o banco use cascata ao excluir usuário, esses objetos são
  agregados manipulados por casos de uso e repositórios próprios.

## Visão técnica das camadas

Este segundo diagrama não substitui o modelo de domínio. Ele mostra o padrão
arquitetural repetido nos módulos NestJS e explica por que controller, caso de
uso e repositório não aparecem como classes de negócio acima.

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

Controller --> AuthGuard : protege rota
Controller --> UseCase : executa
Controller --> Presenter : formata saída
UseCase --> Repository : depende da abstração
UseCase --> DomainEntity : coordena
PrismaRepository ..|> Repository
PrismaRepository --> PrismaService
JwtTokenService ..|> TokenProvider
BcryptjsHashProvider ..|> HashProvider
AuthGuard --> TokenProvider
UseCase --> TokenProvider : autenticação
UseCase --> HashProvider : credenciais
```

O princípio central é **inversão de dependência**: a aplicação conhece
contratos de repositório e provedores; as implementações Prisma, JWT e bcrypt
ficam na infraestrutura. Isso permite testar casos de uso com doubles sem
carregar banco ou servidor HTTP.

## Mapeamento de estado do projeto

No domínio e na API, os valores são `ACTIVE`, `INACTIVE` e `FINISHED`. No enum
Prisma/PostgreSQL, são `ACTIVE`, `PAUSED` e `FINISHED`. O
`ProjectModelMapper` traduz `INACTIVE` ↔ `PAUSED`; portanto não se trata de
herança nem de dois estados simultâneos, mas de uma fronteira de tradução entre
modelos.

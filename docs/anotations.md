# Anotações

## Agregação de projeto

Project deve ser o aggregate root, enquanto ProjectTechnology e ProjectCommand devem ser entidades próprias pertencentes ao projeto.

Em outras palavras:

> **Entidade separada:** sim.
> **Recurso independente como Tag:** não.

A diferença para Tag é:

| Recurso | Pertencimento | Reutilização |
| --- | --- | --- |
| Tag | pertence ao usuário | pode ser usada em várias entradas |
| ProjectTechnology | pertence a um projeto | não existe fora do projeto |
| ProjectCommand | pertence a um projeto | não existe fora do projeto |

Como o schema já possui id, createdAt, updatedAt e tabelas próprias, eu criaria entidades separadas:

```text
project/
├── domain/
│   ├── entities/
│   │   ├── project.entity.ts
│   │   ├── project-technology.entity.ts
│   │   ├── project-command.entity.ts
│   │   └── project-resource.entity.ts
│   └── repositories/
│       ├── project.repository.ts
│       ├── project-technology.repository.ts
│       ├── project-command.repository.ts
│       └── project-resource.repository.ts
├── application/
│   └── usecases/
│       ├── create-project.usecase.ts
│       ├── get-project.usecase.ts
│       ├── list-projects.usecase.ts
│       ├── update-project.usecase.ts
│       ├── add-project-technology.usecase.ts
│       ├── update-project-technology.usecase.ts
│       ├── remove-project-technology.usecase.ts
│       ├── add-project-command.usecase.ts
│       ├── update-project-command.usecase.ts
│       └── remove-project-command.usecase.ts
└── infrastructure/
    ├── project.controller.ts
    ├── project.module.ts
    └── database/
```

Eu não colocaria technology como um módulo global neste momento, porque a tecnologia, no seu modelo atual, só faz sentido dentro de um projeto:

```prisma
model ProjectTechnology {
  projectId String
  name String
  version String?
}
```

Isso permite, por exemplo:

```text
Projeto A
└── NestJS 11

Projeto B
└── NestJS 10
```

Portanto, version é uma característica do uso daquela tecnologia naquele projeto.

Os casos de uso poderiam ser:

```text
POST /projects
GET /projects
GET /projects/:projectId
PATCH /projects/:projectId

POST /projects/:projectId/technologies
PATCH /projects/:projectId/technologies/:technologyId
DELETE /projects/:projectId/technologies/:technologyId

POST /projects/:projectId/commands
PATCH /projects/:projectId/commands/:commandId
DELETE /projects/:projectId/commands/:commandId
```

Para cada operação filha, o caso de uso deve:

1. Buscar o projeto pelo projectId e pelo userId autenticado.
2. Garantir que o projeto pertence ao usuário.
3. Buscar a tecnologia ou comando.
4. Garantir que o recurso pertence àquele projeto.
5. Executar a alteração.

Assim você evita que alguém altere um comando de outro projeto apenas conhecendo o ID.

Eu também evitaria colocar arrays como technologies e commands dentro de ProjectEntity inicialmente. O ProjectEntity representa o projeto e suas regras próprias; as relações podem ser carregadas pelos repositórios e montadas no output do caso de uso. Isso evita transformar todo projeto em um objeto enorme sempre que ele for atualizado.

A relação conceitual fica assim:

```text
Project
├── ProjectTechnology
├── ProjectCommand
├── ProjectResource
└── TechnicalEntry
```

As três primeiras são dependentes do projeto e usam onDelete: Cascade, como já está definido no apps/api/prisma/schema.prisma. Já TechnicalEntry possui uma relação opcional com o projeto e não deve ser removida quando o projeto for arquivado.

O schema/documentação usa ACTIVE, PAUSED e FINISHED, enquanto a aplicação usa ACTIVE, INACTIVE e FINISHED, traduzindo PAUSED para INACTIVE no mapper. O campo archivedAt permanece separado do status: archive() e restore() alteram apenas o arquivamento.

A modelagem atual do Prisma já está próxima dessa arquitetura. O principal agora é implementar essas entidades como filhos do contexto project, e não copiá-las exatamente como Tag, que é um recurso independente do usuário.

---

## Implementação de Solution Attempt

### Decisão de modelagem

`SolutionAttempt` será uma entidade própria, com tabela própria, mas não será um aggregate root independente. Ela será uma entidade filha do agregado de `TechnicalEntry`.

Em outras palavras:

> **Entidade separada:** sim.
> **Agregado independente:** não.
> **Agregado ao qual pertence:** `TechnicalEntry`.

A estrutura conceitual fica assim:

```text
TechnicalEntry (aggregate root)
└── SolutionAttempt
```

Quando a entrada técnica estiver relacionada a um projeto, a relação será apenas contextual:

```text
Project
└── TechnicalEntry (relação opcional)
    └── SolutionAttempt (filho do agregado de TechnicalEntry)
```

Isso significa que a tentativa não deve ser modelada como filha de `Project`. O projeto pode agrupar ou contextualizar a entrada, mas quem possui o histórico da resolução é a própria `TechnicalEntry`.

### Comparação com as outras entidades

| Recurso | Entidade/tabela própria | Aggregate root | Dependente de |
| --- | --- | --- | --- |
| Project | sim | sim | usuário |
| ProjectTechnology | sim | não | `Project` |
| ProjectCommand | sim | não | `Project` |
| Tag | sim | sim, no contexto do usuário | usuário |
| SolutionAttempt | sim | não | `TechnicalEntry` |

`SolutionAttempt` precisa de identidade própria porque uma entrada pode ter várias tentativas, cada uma com sua descrição, resultado e timestamps. Porém, ela não faz sentido sozinha: não deve existir sem uma `TechnicalEntry`, não é reutilizada por outras entradas e não precisa ser acessada como um recurso global do usuário.

Essa é a mesma separação entre entidade e agregado usada em `ProjectTechnology` e `ProjectCommand`: a tabela e a classe existem separadamente para representar dados e comportamento próprios, mas o ciclo de vida continua controlado pelo aggregate root.

### Organização no backend

Como a tentativa pertence ao contexto de `TechnicalEntry`, ela deve ser implementada dentro do módulo `technical-entry`, e não em um módulo global:

```text
technical-entry/
├── domain/
│   ├── entities/
│   │   ├── technical-entry.entity.ts
│   │   └── solution-attempt.entity.ts
│   └── repositories/
│       ├── technical-entry.repository.ts
│       └── solution-attempt.repository.ts
├── application/
│   └── usecases/
│       └── add-solution-attempt.usecase.ts
└── infrastructure/
    ├── dto/
    │   └── add-solution-attempt.dto.ts
    ├── presenters/
    │   └── solution-attempt.presenter.ts
    └── database/
        └── prisma/
            └── repositories/
                └── solution-attempt-prisma.repository.ts
```

O repositório de `SolutionAttempt` pode existir por causa da tabela própria, mas ele não deve permitir que o caso de uso ignore o `TechnicalEntry`. A regra de negócio continua sendo executada a partir do aggregate root.

### Fluxo do caso de uso

O caso de uso `AddSolutionAttempt` poderia seguir este fluxo:

1. Receber `entryId`, `description`, `result` e `userId` do usuário autenticado.
2. Buscar a `TechnicalEntry` pelo `entryId`.
3. Garantir que a entrada pertence ao `userId` autenticado.
4. Garantir que a entrada é do tipo `ISSUE`.
5. Garantir que a entrada não está arquivada.
6. Validar que `description` não está vazia.
7. Validar que `result` é `FAILED`, `PARTIAL` ou `SUCCESSFUL`.
8. Criar a tentativa por meio de uma operação do agregado `TechnicalEntry`.
9. Persistir a tentativa e retornar o resultado.

O endpoint pode seguir o relacionamento aninhado já usado para tags:

```text
POST /technical-entry/:entryId/solution-attempts
```

O corpo da requisição seria:

```json
{
  "description": "Adicionar credentials: include na chamada fetch",
  "result": "SUCCESSFUL"
}
```

O `userId` não deve vir do corpo da requisição. Ele deve ser obtido do usuário autenticado, como já acontece nos demais casos de uso.

### Responsabilidade do domínio

O `TechnicalEntryEntity` deve controlar as regras que dependem do tipo e do estado da entrada. Uma API de domínio possível seria:

```text
technicalEntry.addSolutionAttempt(description, result)
```

Essa operação deve rejeitar:

- uma entrada `LEARNING`;
- uma entrada arquivada;
- uma descrição vazia;
- um resultado fora do enum permitido.

O método pode criar e retornar uma `SolutionAttemptEntity`. A entidade da tentativa fica responsável pelos próprios dados, enquanto o `TechnicalEntryEntity` decide se uma nova tentativa pode ser adicionada.

O caso de uso continua responsável por buscar a entrada e verificar o proprietário, porque essa é uma regra de autorização que depende do usuário autenticado e da persistência. O domínio, por sua vez, protege as invariantes da própria entrada.

### Persistência no Prisma

O schema atual já representa corretamente essa relação:

```prisma
model SolutionAttempt {
  id               String                @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  technicalEntryId String                @map("technical_entry_id") @db.Uuid
  description      String
  result           SolutionAttemptResult
  createdAt        DateTime              @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime              @updatedAt @map("updated_at") @db.Timestamptz(6)
  technicalEntry   TechnicalEntry        @relation(fields: [technicalEntryId], references: [id], onDelete: Cascade)
}
```

O `technicalEntryId` é a chave que garante o pertencimento. O `onDelete: Cascade` expressa a regra de ciclo de vida: ao remover definitivamente a entrada, suas tentativas também são removidas. Arquivar ou reabrir a entrada não remove o histórico.

Como a inclusão inicial grava apenas a tentativa, o repositório pode persistir o novo registro diretamente depois que o agregado validar a operação. Se no futuro a inclusão também alterar dados da `TechnicalEntry`, como um contador ou o último resultado, as duas alterações deverão ser executadas em uma transação.

### Regras do MVP

Para manter o primeiro fluxo pequeno e coerente com os casos de uso já documentados:

- `SolutionAttempt` só pode ser adicionada a `ISSUE`;
- `LEARNING` nunca possui tentativas;
- entradas arquivadas não recebem novas tentativas;
- uma tentativa `SUCCESSFUL` não resolve automaticamente o problema;
- `ResolveTechnicalIssue` continua sendo o caso de uso que exige `conclusion` e define `resolvedAt`;
- ao reabrir uma questão, o histórico de tentativas permanece;
- não é necessário criar endpoints globais como `GET /solution-attempts/:id`;
- no MVP, o caso de uso necessário é `AddSolutionAttempt`; edição e remoção só devem ser adicionadas se houver uma regra de negócio explícita para corrigir o histórico.

Assim, a decisão final é: `SolutionAttempt` é uma entidade persistida separadamente, mas pertence ao agregado de `TechnicalEntry`. O padrão é o mesmo de tecnologias e comandos em relação a `Project`, mudando apenas o aggregate root: `ProjectTechnology` e `ProjectCommand` pertencem a `Project`; `SolutionAttempt` pertence a `TechnicalEntry`.

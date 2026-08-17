Project deve ser o aggregate root,
enquanto ProjectTechnology e ProjectCommand devem ser
entidades próprias pertencentes ao projeto.

Em outras palavras:

> Entidade separada: sim.
> Recurso independente como Tag: não.

A diferença para Tag é:

Recurso Pertencimento Reutilização
━━━━━━━━━━━━━━━━━━━ ━━━━━━━━━━━━━━━━━━━━━ ━━━━━━━━━━━━━━━━━━
Tag pertence ao usuário pode ser usada
em várias
entradas
─────────────────── ───────────────────── ──────────────────
ProjectTechnology pertence a um não existe fora
projeto do projeto
─────────────────── ───────────────────── ──────────────────
ProjectCommand pertence a um não existe fora
projeto do projeto

Como o schema já possui id, createdAt, updatedAt e tabelas
próprias, eu criaria entidades separadas:

project/
├── domain/
│ ├── entities/
│ │ ├── project.entity.ts
│ │ ├── project-technology.entity.ts
│ │ ├── project-command.entity.ts
│ │ └── project-resource.entity.ts
│ └── repositories/
│ ├── project.repository.ts
│ ├── project-technology.repository.ts
│ ├── project-command.repository.ts
│ └── project-resource.repository.ts
├── application/
│ └── usecases/
│ ├── create-project.usecase.ts
│ ├── get-project.usecase.ts
│ ├── list-projects.usecase.ts
│ ├── update-project.usecase.ts
│ ├── add-project-technology.usecase.ts
│ ├── update-project-technology.usecase.ts
│ ├── remove-project-technology.usecase.ts
│ ├── add-project-command.usecase.ts
│ ├── update-project-command.usecase.ts
│ └── remove-project-command.usecase.ts
└── infrastructure/
├── project.controller.ts
├── project.module.ts
└── database/

Eu não colocaria technology como um módulo global neste
momento, porque a tecnologia, no seu modelo atual, só faz
sentido dentro de um projeto:

model ProjectTechnology {
projectId String
name String
version String?
}

Isso permite, por exemplo:

Projeto A
└── NestJS 11

Projeto B
└── NestJS 10

Portanto, version é uma característica do uso daquela
tecnologia naquele projeto.

Os casos de uso poderiam ser:

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

Para cada operação filha, o caso de uso deve:

1. Buscar o projeto pelo projectId e pelo userId autenticado.
2. Garantir que o projeto pertence ao usuário.
3. Buscar a tecnologia ou comando.
4. Garantir que o recurso pertence àquele projeto.
5. Executar a alteração.

Assim você evita que alguém altere um comando de outro projeto
apenas conhecendo o ID.

Eu também evitaria colocar arrays como technologies e commands
dentro de ProjectEntity inicialmente. O ProjectEntity
representa o projeto e suas regras próprias; as relações podem
ser carregadas pelos repositórios e montadas no output do caso
de uso. Isso evita transformar todo projeto em um objeto
enorme sempre que ele for atualizado.

A relação conceitual fica assim:

Project
├── ProjectTechnology
├── ProjectCommand
├── ProjectResource
└── TechnicalEntry

As três primeiras são dependentes do projeto e usam onDelete:
Cascade, como já está definido no apps/api/prisma/
schema.prisma. Já TechnicalEntry possui uma relação opcional
com o projeto e não deve ser removida quando o projeto for
arquivado.

Há ainda duas inconsistências importantes para corrigir antes
de implementar os casos de uso:

- O schema/documentação usa ACTIVE, PAUSED e FINISHED, mas o
  apps/api/src/project/domain/entities/project-status-enum.ts
  usa ACTIVE, INACTIVE e ARCHIVED.

- A documentação define archivedAt como conceito separado do
  status, mas o método archive() atualmente muda o status para
  ARCHIVED. O ideal seria arquivar preenchendo apenas
  archivedAt, mantendo o status funcional do projeto.

A modelagem atual do Prisma já está próxima dessa arquitetura.
O principal agora é implementar essas entidades como filhos do
contexto project, e não copiá-las exatamente como Tag, que é
um recurso independente do usuário.

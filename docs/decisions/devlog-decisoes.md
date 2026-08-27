# DevLog — Decisões do Projeto

## 1. Objetivo

Criar uma aplicação pessoal para registrar conhecimento técnico adquirido durante o desenvolvimento de projetos.

O foco principal será o **diário técnico**, permitindo documentar problemas, tentativas, soluções e aprendizados. Os projetos funcionarão como contexto para esses registros, contendo informações técnicas e operacionais sobre cada aplicação.

A proposta é que o sistema responda perguntas como:

- Em qual projeto esse problema aconteceu?
- Quais tentativas foram realizadas?
- Qual foi a solução final?
- Quais tecnologias estavam envolvidas?
- Como esse projeto é executado localmente?
- Onde estão seus repositórios e documentações?

---

## 2. Decisão principal de produto

O sistema será uma junção de dois conceitos:

1. **Diário técnico**, como funcionalidade principal.
2. **Painel de projetos**, como contexto e organização dos registros técnicos.

Um registro técnico poderá estar relacionado a um projeto, mas essa relação será opcional.

Exemplo:

```text
Registro técnico: Cookie HttpOnly não era enviado
Projeto: API da Barbearia
Tags: NestJS, Next.js, cookies, autenticação
```

O projeto não será tratado como uma tag.

- **Projeto** representa o contexto em que algo aconteceu.
- **Tag** representa o assunto ou tecnologia relacionada.

No MVP, um registro técnico poderá estar associado a no máximo um projeto.

---

## 3. Escopo do MVP

### 3.1 Autenticação

- Cadastro de usuário.
- Login.
- Logout.
- Autenticação com cookie `HttpOnly`.
- Cada usuário poderá acessar apenas seus próprios dados.

### 3.2 Diário técnico

- Criar registros técnicos.
- Editar registros.
- Arquivar registros.
- Relacionar um registro a um projeto.
- Adicionar tags.
- Pesquisar e filtrar registros.
- Registrar tentativas de solução.
- Marcar um problema como resolvido.
- Reabrir um problema resolvido.

### 3.3 Projetos

- Criar projetos.
- Editar projetos.
- Arquivar projetos.
- Registrar tecnologias utilizadas.
- Registrar comandos importantes.
- Registrar links e recursos.
- Informar caminho local do projeto.
- Visualizar os registros técnicos relacionados.

---

## 4. Entidades principais

### 4.1 User

```text
User
- id
- name
- email
- passwordHash
- createdAt
- updatedAt
```

### 4.2 Project

```text
Project
- id
- name
- description
- status
- repositoryUrl
- localPath
- userId
- createdAt
- updatedAt
- archivedAt
```

O projeto servirá como contexto técnico para os registros do diário.

### 4.3 TechnicalEntry

```text
TechnicalEntry
- id
- title
- type
- context
- conclusion
- status
- projectId?
- userId
- createdAt
- updatedAt
- archivedAt
```

Tipos iniciais:

```text
ISSUE
LEARNING
```

#### ISSUE

Usado para problemas técnicos encontrados durante o desenvolvimento.

Exemplo:

```text
Título: Cookie não é enviado ao backend
Contexto: Next.js e NestJS executando em portas diferentes
Conclusão: Foi necessário configurar credentials, CORS e atributos do cookie
```

#### LEARNING

Usado para aprendizados que não surgiram necessariamente de um erro.

Exemplo:

```text
Título: Server Components podem renderizar Client Components
Contexto: Organização de formulários no Next.js
Conclusão: A fronteira client deve ficar próxima da parte interativa
```

### 4.4 SolutionAttempt

```text
SolutionAttempt
- id
- technicalEntryId
- description
- result
- createdAt
```

Resultados possíveis:

```text
FAILED
PARTIAL
SUCCESSFUL
```

Tentativas existirão apenas para registros do tipo `ISSUE`.

`SolutionAttempt` será uma entidade própria, persistida em uma tabela própria, mas não será um aggregate root independente. Ela pertencerá ao agregado de `TechnicalEntry`, que será responsável por permitir ou rejeitar a inclusão de uma nova tentativa.

```text
TechnicalEntry (aggregate root)
└── SolutionAttempt
```

Uma tentativa não será um recurso global do usuário nem será modelada como filha de `Project`. Mesmo quando a `TechnicalEntry` estiver relacionada a um projeto, o histórico da resolução continuará pertencendo à entrada técnica.

### 4.5 Tag

```text
Tag
- id
- name
- userId
```

Relação muitos-para-muitos:

```text
TechnicalEntryTag
- technicalEntryId
- tagId
```

Exemplos de tags:

```text
NestJS
Laravel
Docker
Cookies
Banco de dados
Deploy
Linux
```

### 4.6 ProjectTechnology

```text
ProjectTechnology
- id
- projectId
- name
- version?
```

Exemplos:

```text
NestJS 11
Node.js 22
PostgreSQL 17
Next.js 16
```

`ProjectTechnology` é uma entidade própria pertencente ao agregado de `Project`. Não é uma tecnologia global reutilizável: seu nome e sua versão representam o uso da tecnologia naquele projeto.

### 4.7 ProjectCommand

```text
ProjectCommand
- id
- projectId
- title
- command
- description?
- executionOrder?
```

Exemplo:

```text
Título: Subir ambiente local
Comando: docker compose up -d
```

`ProjectCommand` é uma entidade própria pertencente ao agregado de `Project`. Seu ciclo de vida é controlado pelo projeto e o comando não deve ser acessado como um recurso independente.

### 4.8 ProjectResource

```text
ProjectResource
- id
- projectId
- label
- url
- type
```

Tipos possíveis:

```text
REPOSITORY
DOCUMENTATION
LOCAL_URL
EXTERNAL_URL
OTHER
```

`ProjectResource` também é uma entidade própria pertencente ao agregado de `Project`, seguindo a mesma regra de ciclo de vida de tecnologias e comandos.

---

## 5. Relações

```text
User
 ├── Projects
 ├── TechnicalEntries
 └── Tags

Project
 ├── Technologies
 ├── Commands
 ├── Resources
 └── TechnicalEntries (relação opcional)

TechnicalEntry
 ├── Project opcional
 ├── Tags
 └── SolutionAttempts
```

### 5.1 Limites dos agregados

A existência de uma relação entre duas entidades não significa que elas pertençam ao mesmo agregado. `Project` e `TechnicalEntry` são aggregate roots separados:

```text
Project (aggregate root)
 ├── ProjectTechnology
 ├── ProjectCommand
 └── ProjectResource

TechnicalEntry (aggregate root)
 └── SolutionAttempt
```

A relação entre `Project` e `TechnicalEntry` é apenas contextual e opcional:

```text
Project ──────── relação opcional ──────── TechnicalEntry
```

Isso permite que uma entrada técnica exista sem projeto, seja vinculada ou desvinculada posteriormente e permaneça preservada quando o projeto for arquivado. Portanto, `TechnicalEntry` não deve ser tratada, modificada ou ter seu ciclo de vida gerenciado como parte do agregado de `Project`.

As responsabilidades ficam separadas da seguinte forma:

| Agregado | Entidades filhas | Regra de pertencimento |
| --- | --- | --- |
| `Project` | `ProjectTechnology`, `ProjectCommand`, `ProjectResource` | Cada entidade pertence a um único projeto e não existe fora dele. |
| `TechnicalEntry` | `SolutionAttempt` | Cada tentativa pertence a uma única entrada e só existe para `ISSUE`. |
| `Tag` | Nenhuma das entidades acima | É um recurso independente do usuário, relacionado às entradas por `TechnicalEntryTag`. |

As entidades filhas podem ter classes, tabelas e repositórios próprios para representar sua persistência. Porém, os casos de uso devem entrar pelo aggregate root correspondente e respeitar suas invariantes. A existência de um repositório próprio não transforma a entidade filha em um aggregate root.

### 5.2 Organização modular definida

Os módulos devem refletir os limites dos agregados:

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
│       ├── add-project-technology.usecase.ts
│       ├── update-project-technology.usecase.ts
│       ├── remove-project-technology.usecase.ts
│       ├── add-project-command.usecase.ts
│       ├── update-project-command.usecase.ts
│       └── remove-project-command.usecase.ts
└── infrastructure/
```

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
    └── database/
        └── prisma/
            └── repositories/
                └── solution-attempt-prisma.repository.ts
```

O `AddSolutionAttempt` deve buscar a `TechnicalEntry`, validar o usuário autenticado, o tipo `ISSUE` e o arquivamento, e somente então criar a entidade filha. O endpoint deve permanecer aninhado ao contexto da entrada:

```text
POST /technical-entry/:entryId/solution-attempts
```

Da mesma forma, operações sobre tecnologias, comandos e recursos devem validar o `projectId`, o proprietário do projeto e o pertencimento do recurso antes de executar a alteração.

---

## 6. Regras de negócio iniciais

### Autorização

- Um usuário só pode acessar seus próprios projetos, registros e tags.
- Um registro só pode ser associado a um projeto do mesmo usuário.
- Uma tag só pode ser utilizada pelo usuário que a criou.

### Registros técnicos

- Apenas registros do tipo `ISSUE` podem possuir tentativas de solução.
- Um problema resolvido deve possuir uma conclusão.
- Reabrir um problema preserva todo o histórico de tentativas.
- Registros arquivados não aparecem na listagem principal.

### Projetos

- Projetos arquivados não aparecem na listagem principal.
- Um projeto arquivado não deve receber novos registros técnicos.
- Comandos, tecnologias e recursos pertencem a um único projeto.

### Segurança

- O sistema não armazenará senhas, tokens, chaves ou valores reais de arquivos `.env`.
- Poderá armazenar apenas os nomes das variáveis esperadas.

Exemplo:

```text
DATABASE_URL
JWT_SECRET
COOKIE_DOMAIN
```

---

## 7. Casos de uso do MVP

### Autenticação

```text
RegisterUser
AuthenticateUser
LogoutUser
```

### Projetos

```text
CreateProject
UpdateProject
ArchiveProject
GetProject
ListProjects
AddProjectTechnology
AddProjectCommand
AddProjectResource
```

### Diário técnico

```text
CreateTechnicalEntry
UpdateTechnicalEntry
ArchiveTechnicalEntry
GetTechnicalEntry
ListTechnicalEntries
AddTagToEntry
AddSolutionAttempt
ResolveTechnicalIssue
ReopenTechnicalIssue
```

A associação entre registro e projeto poderá ser feita durante a criação ou atualização do registro, sem exigir obrigatoriamente um caso de uso separado.

---

## 8. Telas iniciais

### `/login`

- Login do usuário.

### `/register`

- Cadastro do usuário.

### `/entries`

Lista geral do diário técnico.

Filtros:

```text
Pesquisa
Projeto
Tipo
Tag
Status
```

### `/entries/[id]`

Exibe:

```text
Título
Tipo
Contexto
Tentativas
Conclusão
Projeto relacionado
Tags
Status
```

### `/projects`

Lista de projetos cadastrados.

### `/projects/[id]`

Exibe:

```text
Informações gerais
Tecnologias
Comandos
Links e recursos
Registros técnicos relacionados
```

Não será criada inicialmente uma tela exclusiva para tags. Elas poderão ser criadas e utilizadas durante a edição dos registros.

---

## 9. Arquitetura planejada

### Backend

- NestJS.
- DDD aplicado apenas onde houver regras reais.
- Clean Architecture.
- Testes unitários de domínio e casos de uso.
- Testes de integração para persistência e controllers.
- PostgreSQL.
- Prisma ou outra ferramenta de persistência escolhida durante a implementação.

Estrutura sugerida:

```text
src/
  modules/
    auth/
    users/
    projects/
    technical-entries/
    tags/
```

Estrutura interna de um módulo:

```text
domain/
application/
infrastructure/
```

### Frontend

- Next.js.
- Server Components por padrão.
- Client Components apenas onde houver interação.
- React Hook Form.
- Zod.
- TanStack Query quando necessário.
- Shadcn UI, caso seja utilizado no projeto.

### Deploy local

- Docker Compose.
- Next.js.
- NestJS.
- PostgreSQL.
- Nginx ou Caddy como proxy reverso.

Topologia planejada:

```text
Browser
   |
Reverse Proxy
   |-- /       -> Next.js
   |-- /api    -> NestJS
                   |
                PostgreSQL
```

---

## 10. Ordem de implementação

```text
1. Autenticação básica
2. Registros técnicos
3. Tags e busca
4. Projetos
5. Relação entre registros e projetos
6. Tentativas e resolução de problemas
7. Tecnologias, comandos e links dos projetos
8. Testes de integração
9. Frontend
10. Deploy local com Docker Compose e proxy reverso
```

O diário técnico deve ser implementado antes do painel detalhado de projetos, pois ele é o núcleo do produto.

---

## 11. Definição de MVP concluído

O MVP será considerado concluído quando for possível:

1. Criar uma conta e autenticar com cookie `HttpOnly`.
2. Criar um projeto.
3. Adicionar tecnologias, comandos e links ao projeto.
4. Criar um registro técnico.
5. Relacionar opcionalmente o registro a um projeto.
6. Adicionar tags ao registro.
7. Registrar tentativas de solução em um problema.
8. Marcar o problema como resolvido.
9. Reabrir um problema preservando o histórico.
10. Pesquisar registros por título, conteúdo, projeto ou tag.
11. Executar toda a aplicação com Docker Compose.
12. Acessar frontend e backend por um proxy reverso local.

---

## 12. Funcionalidades fora do MVP

Não serão incluídas inicialmente:

- Editor Markdown avançado.
- Upload de arquivos.
- Compartilhamento entre usuários.
- Comentários.
- Integração com GitHub.
- Integração com inteligência artificial.
- Kanban ou gerenciamento de tarefas.
- Execução de comandos pelo navegador.
- Acesso SSH.
- Monitoramento contínuo.
- Leitura de logs em tempo real.

Essas funcionalidades aumentariam o escopo sem fortalecer o objetivo principal do projeto.

---

## 13. Evolução futura: ambientes e serviços

Futuramente, o painel de projetos poderá evoluir para documentar ambientes e serviços.

Modelo possível:

```text
Project
  └── Environment
        └── Service
```

### Environment

```text
Environment
- id
- projectId
- name
- type
```

Tipos possíveis:

```text
LOCAL
DEVELOPMENT
STAGING
PRODUCTION
```

### Service

```text
Service
- id
- environmentId
- name
- type
- host
- port
- healthCheckUrl?
- status
```

Exemplo:

```text
Projeto: GAM
Ambiente: Local

Serviços:
- frontend — localhost:5173
- backend — localhost:3000
- postgres — localhost:5432
- proxy — localhost:80
```

Possíveis evoluções:

- Dependências entre serviços.
- Portas e domínios.
- Histórico de disponibilidade.
- Health checks.
- Informações de deployment.
- Comandos para iniciar e parar serviços.

A primeira evolução deverá ser apenas documental.

Executar comandos, acessar Docker, abrir SSH, ler logs ou controlar serviços transforma essa funcionalidade em outro nível de complexidade e segurança. Isso só deverá ser considerado depois que o núcleo estiver estável.

---

## 14. Resumo da decisão

O produto será uma base pessoal de conhecimento técnico organizada pelo contexto dos projetos.

```text
Diário técnico = núcleo do produto
Projetos = contexto e organização
Tags = classificação por assunto ou tecnologia
Serviços e ambientes = evolução futura
```

A prioridade será construir uma aplicação pequena, útil e utilizável desde cedo, evitando adicionar funcionalidades que desviem do objetivo principal.

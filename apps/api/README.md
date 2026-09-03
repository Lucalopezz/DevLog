# DevLog API

Backend do DevLog. A API transforma o diário técnico em recursos persistidos,
organizados por usuário e projeto: entradas sobre problemas e aprendizados,
tentativas de solução, tags, tecnologias, comandos e links úteis.

## Estado atual

A API já possui os módulos de:

- autenticação por JWT em cookie `httpOnly`;
- cadastro e edição do usuário autenticado;
- projetos, com status, arquivamento e restauração;
- entradas técnicas dos tipos `ISSUE` e `LEARNING`;
- tentativas de solução e resolução/reabertura de problemas;
- tags associadas às entradas;
- tecnologias, comandos e recursos vinculados a projetos.

Todas as rotas, exceto o cadastro de usuário e o fluxo de autenticação, exigem
um usuário autenticado. O prefixo global da API é `/api`.

## Tecnologias e responsabilidades

- **NestJS** organiza a aplicação em módulos e expõe os controllers HTTP.
- **Prisma** mapeia o domínio para o PostgreSQL e versiona o banco por meio de
  migrations.
- **PostgreSQL** armazena usuários, projetos e registros técnicos.
- **Jest** cobre regras unitárias, integração com o banco e fluxos HTTP.
- **Cookie de sessão** transporta o JWT. O cliente precisa enviar credenciais
  nas requisições cross-origin.

## Organização do código

Cada recurso possui uma fronteira própria em `src/`:

```text
src/
  auth/              # login, logout, guard e usuário autenticado
  user/              # cadastro e perfil
  project/           # projetos e seus recursos auxiliares
  technical-entry/   # entradas, tags e tentativas de solução
  tag/               # catálogo de tags do usuário
  shared/            # banco, configuração, pipes, filtros e presenters
  app.module.ts      # composição dos módulos
  main.ts            # inicialização e configuração global
```

Dentro das features, a separação principal é:

- `domain/`: entidades, regras e contratos do domínio;
- `application/`: casos de uso e DTOs de entrada/saída;
- `infrastructure/`: controllers, módulos, repositórios Prisma e presenters.

Os casos de uso recebem o `userId` do `AuthGuard`, nunca do corpo enviado pelo
cliente. Buscas e alterações validam a propriedade do recurso para impedir que
um usuário acesse dados de outro. A justificativa dessa decisão está em
[`docs/resource-ownership-validation.md`](docs/resource-ownership-validation.md).

## Configuração local

Na raiz do monorepo, instale as dependências e inicie o PostgreSQL:

```bash
pnpm install
cp .env.example .env
pnpm db:up
```

Configure as variáveis da API em `apps/api/.env`:

```bash
cp apps/api/.env.example apps/api/.env
```

O arquivo deve conter, no mínimo:

| Variável | Uso |
| --- | --- |
| `PORT` | Porta HTTP; padrão `3000` |
| `NODE_ENV` | Ambiente, normalmente `development` |
| `DATABASE_URL` | URL de conexão com o PostgreSQL |
| `JWT_SECRET` | Segredo usado para assinar os tokens |
| `CORS_ALLOWED_ORIGINS` | Origens permitidas pelo frontend |

Depois da primeira instalação, aplique as migrations e gere o cliente Prisma:

```bash
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma migrate deploy
```

O serviço de configuração lê `JWT_EXPIRES_IN_SECONDS` para a duração do JWT.
Os arquivos de exemplo ainda usam o nome legado `JWT_EXPIRES_IN`; se a duração
precisar ser alterada, use o nome lido pelo serviço ou alinhe os exemplos em
uma alteração futura.

## Executar

Com o banco disponível:

```bash
# somente a API, com reload automático
pnpm --filter api dev

# todos os apps do monorepo
pnpm dev
```

Por padrão, a API fica disponível em `http://localhost:3000/api`.

## Principais grupos de rotas

Os controllers são a fonte de verdade dos detalhes de payload e paginação.
Este resumo ajuda a encontrar o ponto de entrada de cada caso de uso:

| Grupo | Exemplos | Acesso |
| --- | --- | --- |
| Auth | `POST /api/auth/login`, `POST /api/auth/logout` | login/logout |
| Users | `POST /api/users`, `GET /api/users/me` | cadastro / autenticado |
| Projects | `GET`, `POST` e `PATCH /api/project/...` | autenticado |
| Entries | `GET`, `POST`, `PATCH` e `DELETE /api/technical-entry/...` | autenticado |
| Tags | `GET`, `POST` e `DELETE /api/tag/...` | autenticado |

Projetos também expõem sub-recursos para entradas técnicas, tecnologias,
comandos e recursos. Entradas expõem tags e tentativas de solução.

## Testes e qualidade

```bash
pnpm --filter api lint
pnpm --filter api test
pnpm --filter api test:cov
```

Os testes de integração e end-to-end usam um PostgreSQL separado. Suba esse
banco antes dos testes e encerre-o ao terminar:

```bash
pnpm --filter api db:test:up
pnpm --filter api test:integration
pnpm --filter api test:e2e
pnpm --filter api db:test:down
```

O banco de testes usa `apps/api/.env.test` e, por padrão, a porta `5433`.
`db:test:reset` remove os dados desse banco; use-o somente quando essa limpeza
for intencional.

## Migrações

O schema está em [`prisma/schema.prisma`](prisma/schema.prisma) e as alterações
versionadas ficam em [`prisma/migrations`](prisma/migrations). Durante o
desenvolvimento, altere o schema com cuidado e registre uma migration antes de
compartilhar a mudança com o restante do time.

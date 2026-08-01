# Fluxo de configuração e conexão com o banco

Este documento explica como o PostgreSQL, o Docker, o Prisma e a API NestJS se relacionam no projeto DevLog.

## Visão geral

O fluxo atual pode ser representado assim:

```text
.env da raiz
   ↓
Docker Compose
   ↓
PostgreSQL no container
   ↓
localhost:5432
   ↑
DATABASE_URL em apps/api/.env
   ↑
Prisma CLI / futuro PrismaService
```

A aplicação possui três responsabilidades diferentes:

1. O Docker inicia e configura o servidor PostgreSQL.
2. O Prisma CLI executa migrations e gera o Prisma Client.
3. A API deverá usar o Prisma Client para executar consultas durante a execução.

No estado atual, o banco e o Prisma CLI estão configurados, mas a API ainda não possui um `PrismaService` registrado e ainda não executa consultas.

## 1. O `.env` da raiz

O arquivo `.env` da raiz contém as variáveis usadas pelo Docker Compose:

```env
POSTGRES_DB=devlog
POSTGRES_USER=devlog
POSTGRES_PASSWORD=devlog
POSTGRES_PORT=5432
```

O script `db:up`, definido no [`package.json`](../../package.json), informa ao Docker Compose que ele deve usar esse arquivo:

```json
"db:up": "docker compose --env-file .env -f docker/compose.yaml up -d database"
```

O arquivo [`docker/compose.yaml`](../../docker/compose.yaml) utiliza essas variáveis para configurar o container:

```yaml
environment:
  POSTGRES_DB: ${POSTGRES_DB}
  POSTGRES_USER: ${POSTGRES_USER}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

Essas variáveis respondem à pergunta:

> Com qual nome, usuário e senha o PostgreSQL deve ser iniciado?

### Mapeamento da porta

No Compose existe o seguinte mapeamento:

```yaml
ports:
  - "${POSTGRES_PORT}:5432"
```

Isso significa:

```text
porta 5432 do computador → porta 5432 do container
```

Por isso, quando a API roda localmente no computador, ela consegue encontrar o banco usando `localhost:5432`.

## 2. O `apps/api/.env`

A API possui outro arquivo de ambiente, localizado em [`apps/api/.env`](../../apps/api/.env.example) — o arquivo real `.env` não deve ser versionado.

O exemplo contém:

```env
DATABASE_URL=postgresql://devlog:devlog@localhost:5432/devlog
PORT=3000
```

A `DATABASE_URL` reúne todas as informações necessárias para localizar o banco:

```text
postgresql://USUARIO:SENHA@HOST:PORTA/BANCO
```

Neste projeto:

```text
postgresql://devlog:devlog@localhost:5432/devlog
                  │       │       │        │
                usuário senha   host     banco
```

Como a API é executada localmente pelo Node e apenas o PostgreSQL está no Docker, o caminho da conexão é:

```text
API local → localhost:5432 → PostgreSQL no Docker
```

## 3. Por que existem duas configurações?

As variáveis dos dois arquivos são usadas por consumidores diferentes.

As variáveis separadas da raiz são usadas pelo Docker:

```env
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_PORT
```

A URL é usada pelo Prisma e pelo driver PostgreSQL:

```env
DATABASE_URL=postgresql://...
```

As configurações representam os mesmos dados, mas em formatos diferentes:

```text
Docker:
POSTGRES_USER=devlog
POSTGRES_PASSWORD=devlog
POSTGRES_DB=devlog

Prisma:
DATABASE_URL=postgresql://devlog:devlog@localhost:5432/devlog
```

Não é o Docker que utiliza a `DATABASE_URL` neste projeto. O Docker utiliza as variáveis `POSTGRES_*`; o Prisma utiliza a URL.

## 4. Quem utiliza a `DATABASE_URL` atualmente?

O arquivo [`apps/api/prisma.config.ts`](../../apps/api/prisma.config.ts) carrega as variáveis de ambiente:

```ts
import 'dotenv/config';
```

Depois, fornece a URL para a configuração do Prisma:

```ts
datasource: {
  url: process.env['DATABASE_URL'],
}
```

Essa configuração é usada por comandos como:

```bash
pnpm --filter api exec prisma migrate dev --name init
pnpm --filter api exec prisma generate
```

O Prisma CLI usa a `DATABASE_URL` para:

- verificar a conexão com o banco;
- executar migrations;
- comparar o schema com o banco;
- realizar introspection, quando necessário;
- gerar o Prisma Client.

## 5. O papel do `schema.prisma`

O arquivo [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma) descreve o modelo do banco para o Prisma.

Por exemplo:

```prisma
model User {
  id    String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name  String @db.VarChar(120)
  email String @unique @db.VarChar(255)
}
```

Esse arquivo não é, por si só, uma conexão com o banco. Ele descreve:

- tabelas;
- colunas;
- tipos;
- relacionamentos;
- índices;
- valores padrão;
- restrições de unicidade.

O Prisma usa essa descrição para gerar:

1. migrations SQL, localizadas em `apps/api/prisma/migrations`;
2. tipos TypeScript;
3. métodos de consulta do Prisma Client.

No Prisma 7, a URL de conexão fica no [`prisma.config.ts`](../../apps/api/prisma.config.ts), em vez de ficar diretamente dentro do bloco `datasource` do `schema.prisma`.

## 6. A API já está conectada ao banco?

Ainda não.

Embora o projeto já tenha:

- `@prisma/client`;
- `@prisma/adapter-pg`;
- o schema Prisma;
- migrations;
- o client gerado;

o [`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts) ainda está vazio:

```ts
@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

Também ainda não existe um serviço que instancie o Prisma Client nem código fazendo chamadas como:

```ts
prisma.user.findMany()
prisma.project.create()
```

Portanto, o estado atual é:

```text
PostgreSQL está rodando
Prisma CLI conhece o banco
API ainda não faz consultas
```
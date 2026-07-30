# Criação do Monorepo

Este documento registra o processo inicial de criação do monorepo do DevLog, contendo:

- backend em NestJS;
- frontend em React com Vite;
- gerenciamento de pacotes com pnpm;
- organização do workspace com pnpm Workspaces;
- execução das aplicações com Turborepo.

## Estrutura inicial

A estrutura adotada para o projeto é:

```text
devlog/
├── apps/
│   ├── api/
│   └── web/
├── packages/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

Responsabilidades:

```text
apps/api     → Backend NestJS
apps/web     → Frontend React com Vite
packages     → Pacotes compartilhados futuros
```

O diretório `packages` pode permanecer vazio inicialmente. Pacotes compartilhados só devem ser criados quando existir uma necessidade real.

---

## 1. Criar a raiz do projeto

```bash
mkdir DevLog
cd DevLog
git init
pnpm init
```

A raiz do projeto representa o monorepo e não uma aplicação Node executável.

O `package.json` da raiz deve utilizar um nome em letras minúsculas e possuir `"private": true` para evitar uma publicação acidental no npm.

Exemplo:

```json
{
  "name": "devlog",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test"
  },
  "devDependencies": {
    "turbo": "latest"
  },
  "packageManager": "pnpm@11.18.0"
}
```

O campo `packageManager` precisa conter uma versão semântica completa:

```text
pnpm@11.18.0
```

Valores incompletos, como:

```text
pnpm@10
```

não são válidos.

Também não é necessário manter simultaneamente os campos `packageManager` e `devEngines.packageManager`.

Caso exista um bloco semelhante a este:

```json
{
  "devEngines": {
    "packageManager": {
      "name": "pnpm",
      "version": "pnpm@11.18.0"
    }
  }
}
```

ele pode ser removido.

Além de duplicar a configuração, o valor de `version` estaria incorreto, pois nesse campo seria necessário utilizar apenas:

```text
11.18.0
```

Para este projeto, foi mantido apenas o campo tradicional:

```json
{
  "packageManager": "pnpm@11.18.0"
}
```

---

## 2. Instalar o Turborepo

Na raiz do projeto:

```bash
pnpm add -D turbo
```

O Turborepo será responsável por coordenar comandos como:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
```

Ele não substitui o pnpm Workspace.

As responsabilidades são diferentes:

```text
pnpm Workspace → organiza os projetos e dependências
Turborepo      → executa e coordena tarefas
```

---

## 3. Configurar o workspace

Crie o arquivo `pnpm-workspace.yaml` na raiz:

```yaml
packages:
  - apps/*
  - packages/*
```

Depois, crie os diretórios principais:

```bash
mkdir -p apps packages
```

O pnpm reconhecerá cada diretório que possuir um `package.json` dentro desses caminhos como parte do workspace.

---

## 4. Criar o backend NestJS

Na raiz do monorepo, execute:

```bash
pnpm dlx @nestjs/cli new apps/api \
  --package-manager pnpm \
  --skip-git
```

A opção `--skip-git` evita que o NestJS crie outro repositório Git dentro de `apps/api`.

O Git deve existir apenas na raiz do monorepo.

A estrutura criada será semelhante a:

```text
apps/api/
├── src/
├── test/
├── package.json
├── nest-cli.json
├── tsconfig.json
└── tsconfig.build.json
```

### Possível falha durante a instalação

O Nest CLI pode criar todos os arquivos corretamente, mas falhar na etapa automática de instalação.

Exemplo:

```text
Packages installation failed
```

Nesse caso, o scaffold não precisa ser recriado. Basta corrigir a configuração do pnpm e executar a instalação manualmente pela raiz:

```bash
pnpm install --strict-peer-dependencies=false
```

Como `apps/api` faz parte do workspace, a instalação deve preferencialmente ser executada na raiz do monorepo.

---

## 5. Aprovar scripts de build do pnpm

Durante a instalação, o pnpm pode bloquear scripts de build de determinadas dependências.

Exemplo:

```text
ERR_PNPM_IGNORED_BUILDS
Ignored build scripts: unrs-resolver
```

Para revisar as dependências bloqueadas:

```bash
pnpm approve-builds
```

Na interface interativa:

```text
Espaço → selecionar o pacote
Enter  → confirmar
```

Se o pacote não for selecionado, o pnpm poderá registrar:

```yaml
allowBuilds:
  unrs-resolver: false
```

Isso significa que a execução do script foi negada.

Como `unrs-resolver` veio da árvore de dependências das ferramentas instaladas pelo scaffold oficial, ele pode ser autorizado:

```yaml
packages:
  - apps/*
  - packages/*

allowBuilds:
  unrs-resolver: true
```

Depois da alteração:

```bash
pnpm install
```

Para verificar se ainda existem scripts bloqueados:

```bash
pnpm ignored-builds
```

---

## 6. Padronizar os scripts da API

O NestJS normalmente cria o script:

```json
{
  "scripts": {
    "start:dev": "nest start --watch"
  }
}
```

O Turborepo executará a tarefa chamada `dev`. Portanto, deve ser adicionado um script com esse nome em `apps/api/package.json`.

Exemplo:

```json
{
  "name": "@devlog/api",
  "scripts": {
    "dev": "nest start --watch",
    "start:dev": "nest start --watch",
    "build": "nest build",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "test": "jest"
  }
}
```

O script `start:dev` pode continuar existindo. O script `dev` funciona como uma padronização para o monorepo.

Para iniciar apenas a API:

```bash
pnpm --filter @devlog/api dev
```

Também é possível filtrar pelo caminho:

```bash
pnpm --filter ./apps/api dev
```

Ou executar diretamente dentro da pasta:

```bash
cd apps/api
pnpm dev
```

A API ficará disponível, por padrão, em:

```text
http://localhost:3000
```

---

## 7. Criar o frontend React com Vite

Na raiz do monorepo:

```bash
pnpm create vite apps/web --template react-ts
```

Depois:

```bash
pnpm install
```

A estrutura será semelhante a:

```text
apps/web/
├── public/
├── src/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

O Vite já cria o script:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

O nome do pacote pode ser alterado para:

```json
{
  "name": "@devlog/web"
}
```

Para iniciar somente o frontend:

```bash
pnpm --filter @devlog/web dev
```

Por padrão, o Vite utiliza:

```text
http://localhost:5173
```

---

## 8. Configurar o Turborepo

Crie o arquivo `turbo.json` na raiz:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "outputs": ["coverage/**"]
    }
  }
}
```

A tarefa `dev` não utiliza cache e permanece ativa porque os servidores de desenvolvimento continuam executando.

A tarefa `build` considera como saída os diretórios `dist`.

Tanto NestJS quanto Vite geram seus builds nesse tipo de diretório.

---

## 9. Executar o monorepo

Depois que `apps/api` e `apps/web` possuírem scripts chamados `dev`, execute na raiz:

```bash
pnpm dev
```

O Turborepo iniciará as duas aplicações:

```text
@devlog/api → nest start --watch
@devlog/web → vite
```

Também é possível executar cada aplicação separadamente:

```bash
pnpm --filter @devlog/api dev
```

```bash
pnpm --filter @devlog/web dev
```

---

## 10. Comunicação entre frontend e backend

Durante o desenvolvimento:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:3000
```

No frontend, pode ser criada uma variável de ambiente:

```env
VITE_API_URL=http://localhost:3000
```

Exemplo de requisição:

```ts
const apiUrl = import.meta.env.VITE_API_URL;

const response = await fetch(`${apiUrl}/entries`, {
  credentials: "include",
});
```

O uso de:

```ts
credentials: "include";
```

é necessário para enviar e receber cookies entre frontend e backend.

No NestJS, o CORS deve permitir a origem do frontend e o envio de credenciais:

```ts
app.enableCors({
  origin: "http://localhost:5173",
  credentials: true,
});
```

---

## 11. Estrutura futura com proxy reverso

No deploy local, frontend e backend ficarão atrás do mesmo domínio:

```text
http://devlog.local
```

A estrutura será:

```text
Browser
   |
Caddy ou Nginx
   |
   ├── /     → React
   └── /api  → NestJS
```

Com isso, o frontend poderá acessar a API usando:

```ts
fetch("/api/entries", {
  credentials: "include",
});
```

Essa configuração simplifica o uso de cookies e evita parte dos problemas relacionados a CORS.

---

## 12. Estrutura interna da API

A arquitetura de domínio deve existir dentro do backend, e não na raiz do monorepo.

Exemplo:

```text
apps/api/src/
├── modules/
│   ├── auth/
│   ├── projects/
│   ├── entries/
│   └── tags/
├── shared/
└── main.ts
```

Cada módulo pode ser dividido em:

```text
entries/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── errors/
├── application/
│   ├── use-cases/
│   └── dto/
└── infrastructure/
    ├── database/
    └── http/
```

Não devem ser compartilhadas entidades de domínio diretamente com o frontend.

Por exemplo, uma entidade como:

```ts
class TechnicalEntry {
  resolve() {}

  reopen() {}
}
```

pertence somente ao backend.

No futuro, contratos da API poderão ser gerados a partir de OpenAPI para utilização no frontend.

---

## Resultado esperado

Depois da configuração inicial, a estrutura deve estar semelhante a:

```text
devlog/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   ├── test/
│   │   └── package.json
│   └── web/
│       ├── src/
│       ├── public/
│       └── package.json
├── packages/
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

Comandos principais:

```bash
# Instalar todas as dependências
pnpm install

# Executar todas as aplicações
pnpm dev

# Executar somente a API
pnpm --filter @devlog/api dev

# Executar somente o frontend
pnpm --filter @devlog/web dev

# Executar prisma
pnpm --filter api exec prisma migrate dev --name init
pnpm --filter api exec prisma generate

# Gerar os builds
pnpm build

# Executar lint
pnpm lint

# Executar testes
pnpm test
```

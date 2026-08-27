# DevLog

O DevLog é uma aplicação pessoal para registrar conhecimento técnico adquirido durante o desenvolvimento de projetos.

O projeto combina um diário técnico com um painel de projetos. Nele, será possível documentar problemas, tentativas de solução, aprendizados, tecnologias, comandos importantes e links úteis de cada projeto.

## Funcionalidades planejadas

- Cadastro, login e logout de usuários;
- Criação e organização de projetos;
- Registros técnicos de problemas (`ISSUE`) e aprendizados (`LEARNING`);
- Tentativas de solução, status de resolução e arquivamento de registros;
- Tags, busca e filtros;
- Tecnologias, comandos e recursos vinculados aos projetos.

## Tecnologias

- Monorepo com pnpm Workspaces e Turborepo;
- Backend em NestJS, Prisma e PostgreSQL;
- Frontend em React, Vite e TypeScript;
- Banco de dados em Docker.

## Estrutura

```text
apps/
  api/      # API NestJS
  web/      # Interface React
docker/     # Configuração do PostgreSQL
docs/       # Decisões e guias do projeto
```

## Como executar

Pré-requisitos: Node.js, pnpm 11.18.0 e Docker.

1. Instale as dependências:

   ```bash
   pnpm install
   ```

2. Crie um arquivo `.env` na raiz com as credenciais do PostgreSQL, por exemplo:

   ```env
   POSTGRES_DB=devlog
   POSTGRES_USER=devlog
   POSTGRES_PASSWORD=devlog
   POSTGRES_PORT=5432
   ```

3. Inicie o banco de dados:

   ```bash
   pnpm db:up
   ```

4. Execute as aplicações em modo de desenvolvimento:

   ```bash
   pnpm dev
   ```

Também é possível executá-las separadamente com `pnpm --filter api dev` e `pnpm --filter web dev`.

## Comandos úteis

```bash
pnpm build                    # Gera a build dos projetos
pnpm lint                     # Executa o lint
pnpm test                     # Executa os testes disponíveis
pnpm --filter api test:e2e    # Executa os testes de integração da API
pnpm db:down                  # Encerra o banco de dados
pnpm db:logs                  # Exibe os logs do banco
```

## Documentação

A documentação está organizada por tipo e possui um índice para ajudar a
encontrar a resposta de uma dúvida:

- [`docs/README.md`](docs/README.md): ponto de entrada da documentação, com o
  mapa de dúvidas e arquivos correspondentes;
- [`docs/decisions/`](docs/decisions/): decisões de produto, arquitetura e
  banco de dados;
- [`docs/guides/`](docs/guides/): explicações e fluxos técnicos;
- [`docs/usecases/`](docs/usecases/): comportamento esperado e regras do
  sistema;
- [`docs/backlog/`](docs/backlog/): tarefas e pendências conhecidas.

Se você é novo no projeto, comece pelo
[`docs/README.md`](docs/README.md) depois de ler as instruções de execução
acima.

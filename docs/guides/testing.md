# Estratégia de testes da API

## Organização

Cada teste fica próximo da implementação que protege, mas separado do código
de produção:

```text
feature/
  classe.ts
  __tests__/
    unit/
      classe.spec.ts
    int/
      classe.int.spec.ts
```

O Jest usa essa estrutura como regra de descoberta. `pnpm --filter api test`
executa somente `__tests__/unit`, enquanto
`pnpm --filter api test:integration` executa somente `__tests__/int`.
Testes end-to-end continuam isolados em `apps/api/test`.

## Unitário ou integração?

Um teste unitário substitui dependências externas por mocks e observa apenas a
decisão da unidade. Em um caso de uso, por exemplo, ele verifica regras,
exceções e chamadas aos contratos de repositório.

Um repositório Prisma pode ter os dois tipos de teste porque eles respondem a
perguntas diferentes:

- o unitário confirma a consulta construída, a paginação, a ordenação e o uso
  do mapper sem depender de PostgreSQL;
- o de integração confirma que essa consulta realmente funciona contra o
  schema, as chaves estrangeiras, os enums e os comportamentos do Prisma.

Cobertura ajuda a localizar código não exercitado, mas não substitui cenários
com boas asserções. Por isso não há uma meta global artificial neste momento.

## Prioridade atual

Os pontos críticos já cobertos são autenticação, casos de uso centrais,
entidades, mappers e os principais repositórios. O próximo ciclo deve seguir
esta ordem:

1. **P1:** controllers de User, Tag, Project e Technical Entry; presenters;
   DTOs sem validação dedicada; integração de ProjectTechnology e
   ProjectResource; ramos restantes de Tag e Technical Entry.
2. **P2:** módulos Nest, `PrismaService`, bootstrap e decorators simples.
   Esses componentes só devem ganhar teste isolado quando tiverem lógica
   própria; normalmente são melhor avaliados por composição ou E2E.

## Execução

Na raiz do repositório:

```bash
pnpm --filter api test
pnpm --filter api test:cov

pnpm --filter api db:test:up
pnpm --filter api test:integration
pnpm --filter api db:test:down
```

O helper de integração só limpa dados quando `NODE_ENV=test`. Nunca use
`pnpm db:reset` apenas para executar testes.

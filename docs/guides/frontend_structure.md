# Organização do frontend

## Regra principal

O frontend é organizado por **domínio dentro de `features/`**. Cada domínio
mantém próximos os artefatos que mudam juntos: chamadas à API, tipos, hooks,
componentes e páginas.

Essa escolha evita pastas globais como `services/`, `types/` ou `components/`
virarem gavetas de código sem relação clara. Código global existe apenas quando
não conhece o domínio do DevLog.

## Estrutura atual

```text
apps/web/src/
  api/                         # infraestrutura HTTP compartilhada
    http.ts
  app/                         # composição global da aplicação
    providers/
      app-providers.tsx
  assets/                      # arquivos importados pelo código
  components/                  # interface reutilizável e sem domínio
    ui/
    markdown.tsx
  features/                    # domínios e funcionalidades do produto
    auth/
      hooks/
        use-login-form.ts
      login.schema.ts
      types.ts
    home/
      pages/
        home-page.tsx
  lib/                         # utilitários e configurações sem domínio
    date.ts
    query-client.ts
    utils.ts
  routes/                      # definição das rotas e guards futuros
    router.tsx
  index.css                    # estilos globais e tokens do tema
  main.tsx                     # ponto de entrada do React
```

Diretórios globais como `hooks/`, `types/` e `test/` serão criados somente
quando houver código compartilhado que justifique sua existência. Não criamos
pastas vazias para uma necessidade futura.

## Estrutura de uma feature

Quando um domínio crescer, sua pasta pode assumir esta forma:

```text
features/projects/
  api/                         # requisições, query keys e mapeamentos do domínio
    list-projects.ts
    create-project.ts
  hooks/                       # hooks específicos de projetos
    use-projects.ts
    use-create-project.ts
  pages/                       # telas atendidas pelas rotas desse domínio
    projects-page.tsx
    project-details-page.tsx
  components/                  # UI que conhece Project e só é usada nesse domínio
    project-form.tsx
    project-card.tsx
  types.ts                     # contratos e tipos próprios do domínio
  presentation.ts              # labels, cores e formatos destinados à interface
  index.ts                     # opcional: API pública intencional da feature
```

As subpastas e os arquivos são opcionais. Por exemplo, uma feature pequena
com apenas uma página não precisa começar com `api/`, `hooks/` e
`components/` vazios.

Os próximos domínios esperados do DevLog são `projects`, `tags` e
`technical-entries`. Funcionalidades como criar, arquivar ou resolver um
registro permanecem inicialmente dentro do domínio correspondente. Somente
extraia uma ação para uma feature própria se ela ganhar complexidade ou passar
a ser reutilizada em fluxos distintos.

## Responsabilidade das pastas raiz

| Pasta | Deve conter | Não deve conter |
| --- | --- | --- |
| `api/` | Cliente Axios, interceptores e tipos genéricos de resposta/paginação. | Requisições de `Project`, `Tag` ou `TechnicalEntry`. |
| `app/` | Providers, configuração global e composição da aplicação. | Páginas ou regras de um domínio. |
| `assets/` | Imagens e fontes importadas por TypeScript/CSS. | Arquivos públicos servidos diretamente; esses ficam em `public/`. |
| `components/` | Componentes genéricos, shadcn e UI sem conhecimento do domínio. | `ProjectCard`, `TagForm` ou componentes exclusivos de uma feature. |
| `features/` | Código específico de um domínio do produto. | Configuração global de React Query, Axios ou tema. |
| `lib/` | Utilitários puros e configurações reutilizáveis, como data, `cn` e Query Client. | Regras ou tipos de domínio. |
| `routes/` | Definições de rota, loaders/actions e guards. | Implementação extensa das páginas. |

## Dependências e imports

O fluxo esperado de dependências é:

```text
api, lib e components  →  features  →  routes e app
```

- `api/`, `lib/` e `components/` não podem importar de uma feature.
- Uma feature pode importar infraestrutura e UI compartilhadas.
- `routes/` aponta para páginas de features, mas não contém a regra de negócio
  dessas páginas.
- Não faça deep import de uma feature para outra. Se uma dependência entre
  domínios for realmente necessária, exponha somente o contrato desejado no
  `index.ts` da feature fornecedora.
- Prefira imports diretos dentro da própria feature. O `index.ts` é uma borda
  pública deliberada, não um arquivo obrigatório de reexports.

## API e estado remoto

O arquivo `api/http.ts` é a única configuração do Axios: URL base, cookies e
futuros comportamentos genuinamente globais. A chamada de um recurso fica no
domínio que o conhece:

```text
features/projects/api/list-projects.ts
features/projects/hooks/use-projects.ts
```

O primeiro arquivo chama `api`; o segundo encapsula a query do React Query.
Assim, uma página não precisa conhecer URL, `queryKey`, cache ou transformação
da resposta.

## Formulários e apresentação

Schemas Zod, tipos inferidos e hooks do React Hook Form permanecem na feature
do formulário. Em `auth`, por exemplo, `login.schema.ts`, `types.ts` e
`hooks/use-login-form.ts` formam uma unidade.

Use `presentation.ts` para detalhes de exibição que não devem vazar para a
API: textos de status, cor de badges, ícones e formatos específicos. A API
pode devolver `PAUSED`; a interface pode decidir que o rótulo apresentado é
“Pausado” nesse arquivo.

## Testes

Quando o frontend receber um runner de testes, `src/test/` deve guardar apenas
infraestrutura compartilhada: setup, handlers do MSW, renderizadores e
factories. Testes de comportamento devem ficar próximos da feature que
protegem, por exemplo:

```text
features/projects/
  components/project-form.tsx
  components/project-form.spec.tsx
```

Essa proximidade torna mais fácil remover ou alterar uma funcionalidade sem
deixar testes órfãos em uma pasta global.

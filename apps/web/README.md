# DevLog Web

Frontend do DevLog. Esta aplicação será a interface para consultar projetos,
registrar problemas e aprendizados e recuperar soluções técnicas já
experimentadas.

## Estado atual

O frontend está na etapa de fundação. A rota `/` exibe uma tela inicial que
confirma a infraestrutura montada, mas as telas completas de login, projetos e
entradas ainda serão construídas.

Já estão preparados:

- roteamento com React Router;
- cliente HTTP Axios apontando para a API e enviando cookies;
- cache e sincronização de dados remotos com TanStack Query;
- validação de formulários com React Hook Form e Zod;
- componentes de interface baseados em Tailwind CSS, shadcn/ui e Radix;
- notificações com Sonner e renderização de conteúdo Markdown;
- React Query Devtools somente em desenvolvimento.

## Tecnologias

- React 19 + TypeScript;
- Vite;
- React Router;
- TanStack Query;
- Axios;
- Tailwind CSS 4;
- shadcn/ui, Radix UI e Lucide;
- React Hook Form + Zod;
- date-fns com localização `pt-BR`.

## Organização do código

```text
src/
  api/                 # cliente HTTP e configuração da API
  app/providers/       # providers globais da aplicação
  components/          # componentes compartilhados e primitives de UI
  features/            # código organizado por funcionalidade
    auth/              # schema, tipos e hooks do login
    home/              # página inicial atual
  lib/                 # query client, datas e utilitários
  routes/              # definição das rotas do navegador
  main.tsx             # ponto de entrada do React
  index.css            # Tailwind, tema e tokens visuais
```

As funcionalidades devem ficar em `features/` quando tiverem regras próprias.
Componentes realmente reutilizáveis pertencem a `components/`; regras
transversais, como datas e cache, pertencem a `lib/`.

## Configuração local

A partir da raiz do monorepo:

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
```

`VITE_API_URL` define a URL base usada por `src/api/http.ts`:

```env
VITE_API_URL=http://localhost:3000/api
```

Se a variável não existir, esse mesmo endereço será usado como fallback. A API
precisa estar rodando e liberando a origem do Vite no `CORS_ALLOWED_ORIGINS`.

## Executar

```bash
# inicia o Vite com hot module replacement
pnpm --filter web dev

# valida tipos e gera a build de produção
pnpm --filter web build

# executa o lint
pnpm --filter web lint

# visualiza localmente a build gerada
pnpm --filter web preview
```

O Vite normalmente disponibiliza o app em `http://localhost:5173`.

## Decisões importantes da base

### Comunicação com a API

Use a instância `api` de `src/api/http.ts` para novas chamadas. Ela já define
`withCredentials: true`, necessário porque o backend armazena o JWT em cookie
seguro. Evite criar instâncias Axios isoladas, pois isso pode quebrar a
autenticação ou produzir URLs inconsistentes.

### Dados remotos

O `queryClient` considera os dados frescos por 30 segundos, não refaz buscas ao
retomar o foco da janela e evita novas tentativas para erros HTTP `4xx`. Essa
política diferencia erro de validação ou autorização de falha temporária do
servidor.

### Formulários e UI

O hook `useLoginForm` é a referência para formulários: o schema Zod descreve os
dados e o React Hook Form controla o estado e a validação. Para estilos, use os
tokens e componentes já definidos em `src/index.css` e `src/components/ui`,
mantendo a composição com classes Tailwind.

## Próximos pontos naturais

1. criar a tela e o fluxo de login usando o endpoint `/api/auth/login`;
2. carregar o usuário atual com `/api/users/me` e proteger rotas privadas;
3. adicionar listagem e edição de projetos e entradas técnicas;
4. conectar tags, tentativas de solução e os sub-recursos dos projetos.

Ainda não há um test runner configurado para o web. Até essa camada existir,
as verificações mínimas para mudanças no frontend são `lint` e `build`.

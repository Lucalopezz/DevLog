# Tutorial guiado: primeira versão de Projects no frontend

Este é o próximo exercício recomendado para o frontend do DevLog.

Or run codex resume and select Documente a feature projects.

## Objetivo deste exercício

Implementar uma primeira versão da tela de projetos com uma fatia vertical
completa:

1. criar um projeto;
2. listar os projetos do usuário autenticado;
3. pesquisar pelo nome;
4. filtrar por status;
5. paginar os resultados;
6. mostrar estados de carregamento, erro e lista vazia;
7. adicionar a rota privada `/projects` e o link na sidebar.

Não implemente tudo de Projects de uma vez. A API também possui detalhes,
tecnologias, comandos, recursos, arquivamento, restauração, edição e exclusão.
Essas serão as próximas fatias da mesma feature.

O motivo dessa ordem é didático: esta primeira entrega ensina o ciclo mais
importante do frontend de dados remotos:

```text
formulário
  → validação local
  → mutation HTTP
  → resposta da API
  → invalidação do cache
  → nova consulta da lista
  → interface atualizada
```

Ao terminar, você terá uma feature útil e uma base que poderá reutilizar em
Tags e Technical Entries.

## Decisão de escopo

### O que entra agora

- rota privada `/projects`;
- consulta `GET /api/project`;
- criação `POST /api/project`;
- filtros de nome e status;
- filtro padrão para exibir apenas projetos não arquivados;
- paginação usando o `meta` devolvido pela API;
- formulário com `name` obrigatório e `description` opcional.

### O que fica para depois

- página de detalhes `/projects/:id`;
- edição;
- arquivar, restaurar e excluir;
- tecnologias;
- comandos;
- recursos;
- debounce da busca;
- testes automatizados do frontend, quando um test runner for configurado.

Essa separação evita duas dificuldades ao mesmo tempo: primeiro você aprende a
listagem e a mutação; depois aprende relações entre recursos e ações sobre um
recurso específico.

## Antes de codar: leia o contrato que já existe

Confira estes arquivos antes de começar:

- `apps/api/src/project/infrastructure/project.controller.ts`;
- `apps/api/src/project/infrastructure/dto/project/create-project.dto.ts`;
- `apps/api/src/project/infrastructure/dto/project/search-project.dto.ts`;
- `apps/api/src/project/infrastructure/presenter/project/project.presenter.ts`;
- `apps/api/src/project/domain/entities/project/project-status-enum.ts`;
- `docs/usecases/projects.md`;
- `docs/guides/frontend_structure.md`.

O backend já está preparado. O frontend precisa apenas representar esse
contrato sem duplicar regras que pertencem ao servidor.

### Endpoints da primeira etapa

| Operação | Endpoint | Corpo ou parâmetros |
| --- | --- | --- |
| listar | `GET /api/project` | `page`, `perPage`, `name`, `status`, `archivedAt`, `sort`, `sortDir` |
| criar | `POST /api/project` | `{ name, description? }` |

O `api` do frontend já possui `baseURL` com `/api` e
`withCredentials: true`. Por isso, as funções da feature devem chamar
`/project`, e não repetir `/api` nem configurar cookies novamente.

### Resposta da listagem

A API retorna uma coleção com esta forma conceitual:

```ts
{
  data: Project[],
  meta: {
    currentPage: number,
    perPage: number,
    lastPage: number,
    total: number
  }
}
```

O campo `data` contém os projetos. O campo `meta` contém as informações para a
paginação. Não calcule a quantidade de páginas no componente: o backend já
calcula `lastPage` a partir da quantidade total de itens.

### Modelo recebido pelo frontend

O presenter do backend devolve, entre outros, estes campos:

```ts
type Project = {
  id: string
  name: string
  description?: string
  status: 'ACTIVE' | 'INACTIVE' | 'FINISHED'
  localPath?: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
}
```

No frontend, datas vindas do JSON devem ser tipadas inicialmente como
`string`. O navegador recebe texto ISO; transformar para `Date` só é necessário
quando a apresentação exigir formatação ou comparação de datas.

Os valores de status são do domínio da API. Os textos em português, cores e
ícones são decisões de apresentação e devem ficar em um arquivo como
`presentation.ts`, não dentro da função HTTP.

## Passo 1 — crie a estrutura da feature

Crie somente as pastas e arquivos que a primeira versão realmente precisa:

```text
apps/web/src/features/projects/
├── api/
│   ├── create-project.ts
│   └── list-projects.ts
├── components/
│   ├── project-form.tsx
│   └── project-list.tsx
├── hooks/
│   ├── use-create-project.ts
│   └── use-projects.ts
├── pages/
│   └── projects-page.tsx
├── presentation.ts
├── schemas/
│   └── project.schema.ts
└── types/
    └── project.ts
```

A separação tem uma intenção:

- `api/` conhece URLs e payloads HTTP;
- `hooks/` conecta a API ao React Query;
- `schemas/` conhece a validação do formulário;
- `components/` conhece a interface de Projects;
- `pages/` compõe a tela e conversa com a rota;
- `presentation.ts` traduz valores do domínio para a interface;
- `types/project.ts` mantém os contratos próprios da feature;
- `api/types.ts` mantém contratos genéricos de transporte, como paginação.

Não coloque chamadas de Axios diretamente em `ProjectsPage`. Isso faria a
página conhecer transporte, cache e regras de consulta ao mesmo tempo.

### Checkpoint

Neste momento, os arquivos podem estar vazios. O importante é você conseguir
explicar por que cada responsabilidade está em sua pasta.

## Passo 2 — modele os tipos do frontend

Em `features/projects/types/project.ts`, declare:

1. o union type `ProjectStatus` com `ACTIVE`, `INACTIVE` e `FINISHED`;
2. o tipo `Project` recebido da API;
3. o tipo `ProjectCollection`, reutilizando o `Pagination<T>` global de
   `@/api/types`;
4. o tipo dos parâmetros de busca;
5. o tipo do payload de criação.

Use tipos próprios do frontend em vez de importar classes do backend. O
frontend e o backend são aplicações separadas; compartilhar uma classe de
entidade criaria acoplamento entre camadas e poderia levar regras internas do
domínio para o navegador.

Uma forma de pensar nos contratos é:

```text
Project                 ← um recurso
ProjectCollection       ← resposta paginada
ListProjectsParams      ← entrada da consulta
CreateProjectInput      ← entrada da mutation
```

Inclua apenas campos que realmente serão usados agora, mas mantenha o tipo
compatível com a resposta da API. `description` e `localPath` podem ser
opcionais; `archivedAt` pode ser ausente em um projeto não arquivado.

## Passo 3 — centralize textos e apresentação de status

Em `features/projects/presentation.ts`, crie um mapa para cada status:

```text
ACTIVE   → Ativo
INACTIVE → Inativo
FINISHED → Finalizado
```

Você também pode definir uma classe visual para cada um:

```text
ACTIVE   → aparência positiva
INACTIVE → aparência neutra
FINISHED → aparência informativa
```

O componente deve consultar esse mapa, em vez de espalhar ternários como
`status === 'ACTIVE'` pela tela.

Isso é uma distinção importante: `ACTIVE` é um valor do domínio; “Ativo” é
uma decisão de idioma da interface. Se a API mudar ou a aplicação ganhar
outro idioma, a alteração fica concentrada na apresentação.

## Passo 4 — implemente a função HTTP de listagem

Em `features/projects/api/list-projects.ts`:

1. importe `api` de `@/api/http`;
2. importe os tipos da feature;
3. crie uma função assíncrona `listProjects(params)`;
4. faça `api.get<ProjectCollection>('/project', { params })`;
5. retorne somente `response.data`.

Não faça a requisição na montagem do componente com `useEffect`. A leitura é
responsabilidade do React Query, porque ele fornece cache, deduplicação,
estado de carregamento, erro e refetch.

### Parâmetros iniciais sugeridos

Na primeira chamada, envie:

```text
page=1
perPage=10
archivedAt=null
sort=createdAt
sortDir=desc
```

O valor textual `null` é entendido pelo DTO do backend como filtro
`archivedAt: null`. Assim, a tela principal mostra projetos não arquivados.
Se você omitir esse parâmetro, a API pode retornar arquivados e não arquivados
juntos, porque a ausência do filtro tem outro significado.

O status pode ficar ausente inicialmente. Dessa forma, a lista mostra projetos
ativos, inativos e finalizados, desde que não estejam arquivados.

## Passo 5 — defina as query keys e crie `useProjects`

No mesmo arquivo da API ou em um pequeno arquivo `projects.keys.ts`, defina uma
hierarquia de chaves:

```text
projects
└── lists
    └── list(params)
```

A chave da lista precisa incluir os parâmetros da busca. O React Query deve
entender que estas são consultas diferentes:

```text
['projects', 'list', { page: 1, name: 'api' }]
['projects', 'list', { page: 2, name: 'api' }]
```

Em `hooks/use-projects.ts`:

1. use `useQuery` do `@tanstack/react-query`;
2. receba os parâmetros como argumento;
3. use a chave que inclui esses parâmetros;
4. passe `listProjects` como `queryFn`;
5. retorne o objeto do React Query.

O componente não precisa saber se os dados vieram de cache ou da rede. Ele
apenas observa `data`, `isPending`, `isError`, `error` e `refetch`.

### Por que os parâmetros fazem parte da chave?

Se a chave fosse apenas `['projects']`, a busca por “api” poderia reaproveitar
incorretamente a resposta da busca por “web”. A chave representa a identidade
da consulta, não apenas o nome do recurso.

## Passo 6 — configure a rota privada

Atualize `apps/web/src/routes/router.tsx`:

1. importe `ProjectsPage`;
2. dentro do ramo que já usa `loader: requireUser`, adicione:

```tsx
{
  path: 'projects',
  Component: ProjectsPage,
}
```

Não crie um novo guard dentro da página. A rota já possui a proteção do
`requireUser`. Lembre-se, porém, de que essa proteção é uma barreira de UX e
de navegação; quem realmente protege os dados é o `AuthGuard` do backend.

O fluxo ficará assim:

```text
acesso a /projects
  → requireUser verifica a sessão
  → sessão válida: ProjectsPage é renderizada
  → sessão inválida: redirect para /login
```

## Passo 7 — adicione o link da sidebar

Em `apps/web/src/components/app-sidebar.tsx`:

1. escolha um ícone do `lucide-react`, como `FolderKanban`;
2. importe o ícone;
3. no menu autenticado, adicione um `SidebarLink` para `/projects`;
4. confirme que o link está dentro do ramo exibido apenas para usuários
   autenticados.

O link deve usar `NavLink`, como o item “Início”. Assim, o React Router informa
quando a rota está ativa e a sidebar aplica o estilo correspondente.

Não duplique a lógica de autenticação na sidebar. `useGetUser` serve para
decidir o que exibir; o loader continua sendo a barreira da rota.

## Passo 8 — monte primeiro a tela de listagem sem formulário

Implemente `features/projects/pages/projects-page.tsx` em pequenas partes.

### 8.1 Cabeçalho

Crie um `main` ou `section` com:

- título “Projetos”;
- texto explicando que são os projetos do usuário;
- botão “Novo projeto” ou uma área de criação visível.

Por enquanto, pode deixar o formulário sempre visível abaixo do cabeçalho. Isso
reduz o escopo inicial. Transformar o formulário em modal ou drawer é um
refinamento posterior.

### 8.2 Estado da consulta

Chame `useProjects` com os parâmetros atuais. Existem duas opções para guardar
esses parâmetros:

- estado local com `useState`, mais simples para a primeira implementação;
- query string com `useSearchParams`, recomendada para esta tela.

Use `useSearchParams` se quiser que a busca possa ser recarregada, compartilhada
e navegada com os botões voltar e avançar do navegador. Nesse modelo, a URL é
a fonte de verdade:

```text
/projects?name=api&status=ACTIVE&page=1
```

Converta valores da URL para os tipos esperados antes de chamar o hook. Por
exemplo, `page` precisa virar número e um status desconhecido deve ser tratado
como ausente.

Uma estratégia prática é manter os campos de filtro como “rascunho” local e
aplicar a busca somente quando o usuário enviar o formulário de filtros. Ao
aplicar um novo filtro, volte para `page=1`; caso contrário, o usuário poderia
estar na página 4 de uma busca antiga e receber uma página vazia na nova busca.

### 8.3 Estados assíncronos

Renderize explicitamente cada estado:

1. `isPending`: skeletons ou uma mensagem “Carregando projetos...”;
2. `isError`: mensagem compreensível e botão “Tentar novamente” usando
   `refetch`;
3. resposta sem itens: estado vazio com convite para criar o primeiro projeto;
4. resposta com itens: lista de projetos;
5. refetch depois de uma consulta existente: mantenha os dados visíveis e,
   se desejar, mostre um indicador menor de atualização.

Não trate `isPending` e lista vazia como a mesma coisa. `isPending` significa
que ainda não sabemos o resultado; lista vazia significa que a API respondeu e
não encontrou itens.

### 8.4 Card ou linha de projeto

Em `components/project-list.tsx`, renderize cada projeto com:

- nome;
- descrição, quando existir;
- badge com o status traduzido;
- data de criação ou atualização formatada;
- indicação de caminho local somente quando existir.

Use `project.id` como `key`, não o índice do array. O id representa a
identidade do recurso mesmo quando a ordenação ou a paginação muda.

Por enquanto, o card pode ser somente leitura. Não coloque botões de editar,
arquivar ou excluir antes de implementar as mutations correspondentes.

## Passo 9 — implemente a paginação

Depois que a lista básica funcionar, adicione:

- botão “Anterior”;
- botão “Próxima”;
- texto `Página X de Y`;
- opcionalmente, total de projetos.

Use `meta.currentPage` e `meta.lastPage`:

```text
Anterior desabilitado quando currentPage <= 1
Próxima desabilitada quando currentPage >= lastPage
```

Ao trocar de página, atualize apenas `page` nos parâmetros da consulta.
Mantenha `name`, `status`, `archivedAt`, `sort` e `sortDir`; a paginação faz
parte da mesma busca, não inicia uma busca sem filtros.

O backend usa `perPage` para calcular `lastPage`. O frontend não deve tentar
reimplementar essa regra contando apenas os itens que recebeu, porque a página
atual pode ter menos itens que o limite e ainda haver outras páginas.

## Passo 10 — crie o schema do formulário

Em `features/projects/schemas/project.schema.ts`, use Zod para representar as
regras conhecidas antes de chamar a API:

- `name`: texto obrigatório, mínimo de 3 e máximo de 150 caracteres;
- `description`: texto opcional.

Esses limites aparecem no `CreateProjectDto` do backend e devem ser refletidos
no formulário para dar feedback rápido ao usuário. Ainda assim, mantenha a
validação no backend: o navegador pode ser burlado e diferentes clientes podem
consumir a mesma API.

Use `zodResolver` com `useForm`, seguindo o padrão de
`features/auth/hooks/use-login-form.ts`.

O fluxo do formulário é:

```text
input controlado pelo React Hook Form
  → zodResolver
  → se válido, onSubmit recebe os dados tipados
  → mutation chama POST /api/project
```

Considere normalizar `name` com `trim()` antes de enviar. Isso melhora a
experiência, mas não substitui a validação do backend. Decida conscientemente
se espaços da descrição devem ser preservados.

## Passo 11 — implemente `ProjectForm`

Em `components/project-form.tsx`:

1. crie o formulário com `useForm` e o schema;
2. envolva os campos com o componente `Form` do projeto;
3. use `FormInput` para o nome;
4. use `FormField` + `FormControl` com um `textarea` para a descrição, ou
   crie um `FormTextarea` reutilizável somente se essa necessidade aparecer em
   outras features;
5. mostre `FormMessage` em cada campo;
6. adicione um botão de submit;
7. desabilite o botão enquanto a mutation estiver pendente;
8. altere o texto para “Criando...” durante o envio;
9. após sucesso, limpe o formulário;
10. permita que a página decida onde o formulário será exibido.

O `FormField` é importante porque conecta valor, erro, label e acessibilidade.
Não use apenas `useState` para o valor e um `if` separado para erros; isso
duplicaria responsabilidades que o padrão React Hook Form + shadcn já resolve.

### Acessibilidade para observar

Confirme no navegador que:

- cada label aponta para seu input;
- o campo inválido recebe `aria-invalid`;
- a mensagem de erro é associada por `aria-describedby`;
- o formulário pode ser usado somente com teclado;
- o botão comunica o estado de envio e não permite submits repetidos.

Esses detalhes já são favorecidos pelos componentes `FormLabel`, `FormControl`
e `FormMessage` existentes.

## Passo 12 — implemente a função HTTP de criação

Em `features/projects/api/create-project.ts`:

1. crie uma função `createProject(input)`;
2. faça `api.post<Project>('/project', input)`;
3. retorne `response.data`.

A função HTTP não deve exibir toast, navegar ou invalidar queries. Ela deve
conhecer somente a comunicação com a API. Efeitos de interface pertencem ao
hook ou ao componente que possui o contexto da tela.

## Passo 13 — crie `useCreateProject`

Em `hooks/use-create-project.ts`, use `useMutation`.

### `mutationFn`

Passe `createProject` como `mutationFn`. Isso conecta os dados validados do
formulário ao POST.

### `onSuccess`

Depois de criar:

1. invalide as queries de listas de projetos;
2. mostre `toast.success('Projeto criado com sucesso!')`;
3. deixe o formulário ser resetado pelo componente ou informe esse sucesso
   por callback;
4. não navegue para detalhes, porque a tela de detalhes ainda não existe.

A invalidação é necessária porque a lista antiga continua correta apenas para o
instante anterior à criação. Ao invalidar a chave de lista, o React Query
refaz a consulta e traz a ordenação e a paginação oficiais do servidor.

### `onError`

Use `getApiErrorMessage` com uma mensagem de fallback, por exemplo:

```text
Não foi possível criar o projeto. Tente novamente.
```

O helper já normaliza o formato de erro do Nest, que pode ser uma string ou um
array de mensagens. Assim, o hook não precisa conhecer detalhes do Axios.

### Por que invalidar em vez de inserir manualmente?

Você poderia usar `queryClient.setQueryData` para colocar o projeto novo no
início da lista. Isso é mais imediato, mas exige manter manualmente a ordenação,
o total e todas as páginas afetadas. Na primeira versão, invalidar é mais
simples e confiável. Depois de entender o fluxo, estude atualização otimista e
atualização manual de cache.

## Passo 14 — conecte formulário, página e mutation

Decida onde o hook de mutation será instanciado. Uma opção clara para estudar
é instanciá-lo na página e passar para o formulário somente o necessário:

```text
ProjectsPage
  ├── useProjects(params)
  ├── useCreateProject()
  ├── ProjectForm(onSubmit, isPending)
  └── ProjectList(data)
```

O fluxo completo deve ser:

```text
usuário preenche nome e descrição
  → ProjectForm valida com Zod
  → onSubmit entrega dados válidos à página
  → useCreateProject executa POST
  → API retorna o projeto criado
  → hook invalida ['projects', 'lists']
  → useProjects refaz GET
  → lista mostra o novo projeto
```

Não faça `window.location.reload()`. O React Query já sabe atualizar a parte
da interface que depende dos dados modificados.

## Passo 15 — trate filtros sem criar requisições desnecessárias

Adicione um formulário separado para filtros:

- input de nome;
- select nativo de status com a opção “Todos”;
- botão “Buscar”;
- botão “Limpar”.

Ao buscar:

1. remova parâmetros vazios;
2. preserve `archivedAt=null`;
3. defina `page=1`;
4. atualize a query string ou o estado escolhido;
5. deixe a mudança dos parâmetros gerar uma nova `queryKey`.

Ao limpar, volte para o estado inicial. Não adicione debounce ainda: primeiro
entenda a relação entre parâmetros, query key e resposta. Depois, se a busca
for disparada a cada tecla, compare essa solução com um botão de envio e
estude debounce com cuidado.

### Atenção ao status

O valor vazio do select deve significar “não enviar `status`”. Não envie a
string `"ALL"`, porque `ALL` não faz parte do enum aceito pelo backend.

## Passo 16 — valide o comportamento manualmente

Com a API, o banco e o frontend executando, verifique:

### Sessão

- visitante que acessa `/projects` é redirecionado para `/login`;
- usuário autenticado consegue abrir `/projects`;
- o link aparece na sidebar somente durante uma sessão válida.

### Listagem

- carregamento mostra feedback visual;
- lista mostra apenas projetos não arquivados por padrão;
- status aparece traduzido;
- descrição ausente não cria um espaço estranho;
- lista vazia tem uma mensagem útil;
- erro oferece nova tentativa;
- paginação preserva os filtros.

### Criação

- nome vazio mostra erro local;
- nome com menos de 3 caracteres mostra erro local;
- nome com mais de 150 caracteres mostra erro local;
- descrição é opcional;
- botão não permite vários envios enquanto a requisição está pendente;
- erro da API aparece em toast;
- sucesso mostra toast e o novo projeto aparece sem recarregar a página.

### Rede e cache

Use o DevTools do React Query já configurado no projeto e o painel Network do
navegador para observar:

1. qual query key foi criada;
2. quais parâmetros foram enviados;
3. quando a query fica `pending`, `success` ou `error`;
4. qual requisição acontece depois da criação;
5. se o cookie é enviado pela configuração global do Axios.

Esse acompanhamento é parte do exercício. Não basta a tela “parecer” correta;
entenda quais eventos produziram cada mudança.

## Passo 17 — validação técnica

Depois de implementar a primeira versão, execute na raiz:

```bash
pnpm --filter web lint
pnpm --filter web build
```

Corrija os avisos de TypeScript e ESLint antes de continuar. Em especial,
observe:

- tipos de `status` vindos de `URLSearchParams`, que são apenas `string`;
- campos opcionais possivelmente `undefined`;
- imports que não são usados;
- componentes React exportados no mesmo arquivo de forma incompatível com o
  Fast Refresh;
- nomes de query keys usados de forma diferente entre query e mutation.

Como o frontend ainda não possui test runner, a validação mínima desta etapa é
lint, build e o roteiro manual acima.

## Critérios de conclusão da primeira fatia

Considere Projects pronto para a próxima etapa quando:

- `/projects` é uma rota privada funcional;
- a lista vem da API e usa os parâmetros corretamente;
- filtros e paginação geram consultas diferentes no React Query;
- a criação valida localmente e envia o payload correto;
- o cache é invalidado após sucesso;
- loading, erro e vazio são estados distintos;
- a sidebar possui o link correto;
- `pnpm --filter web lint` e `pnpm --filter web build` passam.

## Próxima ordem depois desta etapa

Quando a primeira fatia estiver estável, avance nesta ordem:

1. `GET /api/project/:id` e página `/projects/:id`;
2. tecnologias do projeto;
3. comandos e recursos, cada um como uma pequena lista + mutation;
4. edição com `PATCH /api/project/:id`;
5. arquivamento e restauração;
6. exclusão com confirmação;
7. melhorar paginação, debounce e atualização de cache.

O detalhe deve vir antes das ações complexas porque ele cria o contexto para
tecnologias, comandos e recursos. Ao implementar cada nova operação, repita o
mesmo raciocínio:

```text
contrato da API
  → tipo
  → função HTTP
  → query ou mutation
  → componente
  → estados assíncronos
  → cache
  → validação manual
```

## Assuntos para estudar enquanto implementa

- diferença entre estado local e estado remoto;
- identidade de uma query e composição de `queryKey`;
- `useQuery` versus `useMutation`;
- invalidação e atualização manual de cache;
- diferença entre validação no cliente e validação no servidor;
- `FormProvider`, `Controller` e acessibilidade em formulários;
- loaders do React Router como barreira de navegação;
- paginação baseada em metadados do servidor;
- separação entre domínio, transporte e apresentação;
- estados de UI: pending, error, empty, success e refetching.

Se algo parecer difícil, implemente primeiro sem filtros e sem paginação,
confirme o ciclo `GET → renderização`, depois adicione uma responsabilidade por
vez. O objetivo deste arquivo é servir como roteiro de estudo, não como uma
lista para copiar inteira de uma vez.

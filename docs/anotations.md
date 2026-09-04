# Guia rápido: rotas privadas e navbar lateral com shadcn/ui

Este guia mostra como:

1. proteger rotas no React Router sem criar um componente `PrivateRoute`;
2. montar uma navbar lateral usando o componente `Sidebar` do shadcn/ui;
3. exibir links públicos para visitantes e ações privadas para usuários autenticados;
4. conectar o botão de logout ao React Query e à sessão da API.

Os exemplos consideram a estrutura atual do `apps/web`:

- React Router `8.x`, usando `createBrowserRouter` e loaders;
- React Query para buscar e armazenar o usuário atual;
- Axios com `withCredentials: true`;
- autenticação por cookie HttpOnly;
- imports a partir do alias `@/`.

## 1. A ideia moderna: proteger a rota com `loader`

Uma abordagem antiga cria um componente parecido com:

```tsx
<PrivateRoute>
  <HomePage />
</PrivateRoute>
```

Esse componente precisa renderizar primeiro para então decidir se o usuário pode
continuar. Com o data router do React Router, a verificação pode acontecer no
`loader` da rota. O router executa o loader antes de renderizar a página:

```text
usuário acessa /dashboard
        ↓
loader chama GET /users/me
        ↓
401? ──────────────── sim ──→ redirect('/login')
        │
        não
        ↓
React Router renderiza o layout e a página protegida
```

O `loader` é uma barreira de navegação e de renderização no frontend. Ele não
substitui a proteção do backend: todos os endpoints privados ainda precisam
validar o cookie/token e responder `401 Unauthorized` quando necessário.

## 2. Confirmar o endpoint do usuário atual

O frontend já possui esta separação:

```text
features/auth/
├── api/get-current-user.ts  ← chamada HTTP
├── hooks/use-get-user.ts    ← integração com React Query
└── types.ts                 ← tipo User
```

O arquivo `apps/web/src/features/auth/api/get-current-user.ts` deve ter uma
função equivalente a esta:

```tsx
import { api } from '@/api/http'
import type { User } from '../types'

export const currentUserQueryKey = ['currentUser', 'auth'] as const

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>('/users/me')
  return data
}
```

O `withCredentials: true` do Axios é importante: ele permite que o navegador
envie o cookie HttpOnly para a API. O JavaScript não deve tentar ler esse
cookie, pois essa é justamente uma das proteções contra roubo por scripts.

## 3. Criar o loader da rota privada

Crie `apps/web/src/routes/require-user.ts`:

```tsx
import { isAxiosError } from 'axios'
import { redirect } from 'react-router'
import {
  currentUserQueryKey,
  getCurrentUser,
} from '@/features/auth/api/get-current-user'
import { queryClient } from '@/lib/query-client'

/**
 * Executa antes de qualquer rota protegida.
 *
 * query aproveita o cache do React Query. Assim, o loader continua
 * sendo a barreira da rota sem criar uma segunda estratégia de armazenamento
 * para o usuário autenticado.
 */
export async function requireUser() {
  try {
    return await queryClient.query({
      queryKey: currentUserQueryKey,
      queryFn: getCurrentUser,
      retry: false,
    })
  } catch (error) {
    // Somente uma sessão inválida deve mandar o usuário para o login.
    // Outros erros, como API fora do ar, precisam continuar visíveis para a
    // tela de erro do router em vez de parecerem um logout.
    if (isAxiosError(error) && error.response?.status === 401) {
      throw redirect('/login')
    }

    throw error
  }
}
```

### Por que usar `query`?

`getCurrentUser()` sozinho resolveria o problema, mas o resultado ficaria
separado do cache usado por `useGetUser()`. `query` mantém o mesmo
`queryKey` e evita uma requisição desnecessária quando o usuário já foi
carregado, por exemplo, logo depois do login.

O `throw redirect('/login')` interrompe a execução do loader. Portanto, a
`HomePage` nem chega a ser renderizada quando não existe uma sessão válida.

## 4. Opcional: impedir que usuário autenticado veja o login

Rotas públicas normalmente podem ser acessadas por qualquer pessoa. Porém,
`/login` e `/register` ficam melhores quando redirecionam um usuário que já
está autenticado.

Adicione ao mesmo arquivo:

```tsx
/**
 * Loader para páginas destinadas apenas a visitantes.
 * Uma resposta 401 é esperada nesse caso: significa que não há sessão.
 */
export async function redirectAuthenticatedUser() {
  try {
    await queryClient.query({
      queryKey: currentUserQueryKey,
      queryFn: getCurrentUser,
      retry: false,
    })

    throw redirect('/')
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      return null
    }

    // O redirect é uma Response lançada de propósito e deve continuar sendo
    // tratado pelo React Router.
    throw error
  }
}
```

Não é obrigatório usar esse segundo loader. O importante para uma rota privada
é `requireUser`.

## 5. Criar um layout que contém a sidebar

O layout fica em torno das páginas filhas. `Outlet` é o ponto em que o React
Router injeta a página correspondente à URL atual.

Crie `apps/web/src/routes/root-layout.tsx`:

```tsx
import { Outlet } from 'react-router'
import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

export function RootLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          {/* No mobile, o SidebarTrigger abre a sidebar como um drawer. */}
          <SidebarTrigger aria-label="Abrir menu de navegação" />
        </header>

        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

O `SidebarProvider` controla o estado aberto/fechado e a responsividade. O
`SidebarInset` reserva o espaço visual da área principal. Dessa forma, as
páginas não precisam repetir a estrutura da navbar.

## 6. Organizar as rotas públicas e privadas

Atualize `apps/web/src/routes/router.tsx`:

```tsx
import { createBrowserRouter } from 'react-router'
import LoginPage from '@/features/auth/pages/login-page'
import HomePage from '@/features/home/pages/home-page'
import { RootLayout } from './root-layout'
import {
  redirectAuthenticatedUser,
  requireUser,
} from './require-user'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Rotas públicas: qualquer visitante pode acessá-las.
      {
        path: '/login',
        loader: redirectAuthenticatedUser,
        Component: LoginPage,
      },
      {
        path: '/register',
        loader: redirectAuthenticatedUser,
        // Crie essa página quando o cadastro for implementado.
        // Component: RegisterPage,
      },

      // Todas as rotas dentro deste ramo passam pelo requireUser.
      {
        loader: requireUser,
        children: [
          {
            index: true,
            Component: HomePage,
          },
          // Exemplo de nova rota privada:
          // { path: 'account', Component: AccountPage },
        ],
      },
    ],
  },
])
```

### O que torna uma rota privada?

Não é o `Component: HomePage`. A privacidade vem do fato de `HomePage` ser
filha do ramo que possui `loader: requireUser`.

Para criar outra rota protegida, coloque-a dentro de `children` desse ramo:

```tsx
{
  loader: requireUser,
  children: [
    { index: true, Component: HomePage },
    { path: 'account', Component: AccountPage },
    { path: 'projects', Component: ProjectsPage },
  ],
}
```

Atenção: a página pública de cadastro ainda não existe na estrutura atual.
Enquanto ela não for criada, remova esse objeto de rota ou crie um
`RegisterPage`; deixar uma rota sem `Component`, `element` ou `children` não é
uma rota renderizável.

## 7. Adicionar os componentes do shadcn/ui

Execute a partir de `apps/web`:

```bash
cd apps/web
pnpm dlx shadcn@latest add sidebar
```

Esse é o mínimo necessário para a navbar lateral. O CLI adiciona os arquivos
de composição em `src/components/ui/sidebar.tsx` e suas dependências.

Para adicionar vários componentes de uma vez, use:

```bash
pnpm dlx shadcn@latest add sidebar button separator avatar dropdown-menu
```

Componentes úteis neste exemplo:

| Componente | Uso |
| --- | --- |
| `sidebar` | estrutura lateral, menu, footer e suporte mobile |
| `button` | ações explícitas, como salvar ou sair |
| `separator` | separar grupos visualmente |
| `avatar` | representar a conta do usuário |
| `dropdown-menu` | colocar ações de conta em um menu suspenso |

Como o projeto já possui `components/ui/button.tsx` e a configuração do
shadcn, não é necessário executar `init` novamente. Se você estiver usando o
guia em outro projeto sem shadcn configurado, faça primeiro:

```bash
pnpm dlx shadcn@latest init
```

O shadcn não é uma biblioteca de componentes instalada e importada como um
pacote único. O CLI copia/adiciona os componentes ao seu código, permitindo
que você leia e personalize a implementação.

## 8. Implementar a sidebar pública e privada

Crie `apps/web/src/components/app-sidebar.tsx`:

```tsx
import type { ReactNode } from 'react'
import {
  CircleUserRound,
  LogIn,
  LogOut,
  UserPlus,
} from 'lucide-react'
import { NavLink } from 'react-router'
import { useGetUser } from '@/features/auth/hooks/use-get-user'
import { useLogout } from '@/features/auth/hooks/use-logout'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

function SidebarLink({
  to,
  children,
  end = false,
}: {
  to: string
  children: ReactNode
  end?: boolean
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          end={end}
          to={to}
          className={({ isActive }) =>
            cn(
              'w-full',
              isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
            )
          }
        >
          {children}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar() {
  const { data: user, isPending } = useGetUser()
  const { mutate: logout, isPending: isLoggingOut } = useLogout()

  const isAuthenticated = Boolean(user)

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            D
          </span>
          <span>DevLog</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isAuthenticated ? (
          <SidebarGroup>
            <SidebarGroupLabel>Minha conta</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarLink end to="/">
                  <CircleUserRound />
                  <span>Início</span>
                </SidebarLink>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel>Acesso</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarLink to="/login">
                  <LogIn />
                  <span>Entrar</span>
                </SidebarLink>

                <SidebarLink to="/register">
                  <UserPlus />
                  <span>Criar conta</span>
                </SidebarLink>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Evita uma interface vazia enquanto a sessão ainda está sendo
            verificada. A rota privada continua protegida pelo loader. */}
        {isPending ? (
          <p className="px-4 text-sm text-muted-foreground">
            Verificando sessão...
          </p>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        {user ? (
          <SidebarMenu>
            {/* A conta fica no rodapé, separada da navegação principal. */}
            <SidebarLink to="/account">
              <CircleUserRound />
              <span className="truncate">{user.name}</span>
            </SidebarLink>

            <SidebarMenuItem>
              <SidebarMenuButton
                disabled={isLoggingOut}
                onClick={() => logout()}
                type="button"
              >
                <LogOut />
                <span>{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  )
}
```

### Como os campos são separados?

O valor de `user` vem da query `useGetUser()`:

- `user` existe: a sidebar mostra `Conta do usuário` e `Sair`;
- `user` não existe: a sidebar mostra `Entrar` e `Criar conta`;
- `isPending` é verdadeiro: a aplicação ainda está descobrindo o estado da sessão.

`NavLink` recebe `isActive` do React Router, então o item da rota atual pode
receber uma classe diferente sem comparar manualmente `window.location`.

O logout é um botão, e não um link, porque ele executa uma mutação HTTP. Depois
que a API responde com sucesso, o hook existente `useLogout` remove a query do
usuário e navega para `/login`.

## 9. Reutilizar o hook de logout corretamente

O hook atual pode seguir esta lógica:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { currentUserQueryKey } from '../api/get-current-user'
import { logout } from '../api/logout'

export function useLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Remover o cache impede que a interface continue exibindo o usuário
      // depois que a sessão foi encerrada.
      queryClient.removeQueries({ queryKey: currentUserQueryKey })
      navigate('/login', { replace: true })
    },
  })
}
```

A ordem conceitual é:

```text
clique em Sair
  → POST /auth/logout
  → remover currentUser do cache
  → navegar para /login
  → loaders privados passam a redirecionar
```

Não remova o usuário do cache antes da resposta da API se a intenção for
garantir que o logout no servidor terminou. Se a requisição falhar, você pode
mostrar uma mensagem de erro e manter a sessão visível.

## 10. Fluxo completo depois da implementação

### Visitante acessando uma página pública

```text
GET /login
  → RootLayout é renderizado
  → requireUser não é executado
  → visitante vê Entrar e Criar conta
```

### Visitante acessando uma página privada

```text
GET /
  → loader requireUser
  → GET /users/me
  → API responde 401
  → redirect('/login')
```

### Usuário autenticado acessando uma página privada

```text
GET /
  → loader requireUser
  → GET /users/me
  → API responde 200 com User
  → HomePage é renderizada dentro do RootLayout
  → sidebar mostra Conta do usuário e Sair
```

### Usuário fazendo login

O hook de login deve atualizar o mesmo `currentUserQueryKey` antes de navegar:

```tsx
onSuccess: (user) => {
  queryClient.setQueryData(currentUserQueryKey, user)
  navigate('/', { replace: true })
}
```

Assim, quando o router executar `requireUser` após a navegação, ele poderá
reaproveitar o usuário que acabou de ser recebido pela API.

## 11. Erros comuns

### Proteger somente a sidebar

Esconder links privados não protege a URL. Uma pessoa ainda poderia digitar
`/account` diretamente. A regra de acesso precisa estar no loader e no backend.

### Guardar o JWT no `localStorage`

Neste projeto a sessão usa cookie HttpOnly. Não tente ler o token no frontend.
O navegador envia o cookie por meio de `withCredentials`, e a API valida a
autenticação.

### Redirecionar qualquer erro para login

Se o banco ou a API estiverem fora do ar, isso não significa que o usuário fez
logout. Redirecione somente para `401`; deixe outros erros chegarem à tela de
erro do router.

### Fazer a requisição apenas em um `useEffect`

Um `useEffect` costuma renderizar a página protegida por alguns instantes antes
de descobrir a sessão. O loader é adequado porque a decisão acontece antes da
renderização da rota.

### Usar `Link` para logout

`Link` representa navegação. Logout é uma operação assíncrona que precisa lidar
com `loading`, sucesso e erro; por isso deve ser um `button` conectado a uma
mutation.

## 12. Checklist de implementação

- [ ] `getCurrentUser` chama o endpoint de sessão e usa o cookie da API.
- [ ] `requireUser` redireciona somente em `401`.
- [ ] Todas as páginas privadas são filhas do ramo com `loader: requireUser`.
- [ ] O `RootLayout` usa `SidebarProvider`, `Sidebar` e `Outlet`.
- [ ] O comando do shadcn adicionou `sidebar` em `src/components/ui`.
- [ ] Visitantes veem `Entrar` e `Criar conta`.
- [ ] Usuários autenticados veem `Conta do usuário` e `Sair`.
- [ ] Logout remove o cache de `currentUser` e navega com `replace: true`.
- [ ] O backend também protege seus endpoints privados.

## O que estudar depois

Para entender profundamente essa solução, estude nesta ordem:

1. loaders, actions e `redirect` do React Router;
2. rotas aninhadas e `Outlet`;
3. cache, query keys e mutations do React Query;
4. cookies HttpOnly, `SameSite`, CORS e `withCredentials`;
5. composição e acessibilidade de componentes do shadcn/ui.

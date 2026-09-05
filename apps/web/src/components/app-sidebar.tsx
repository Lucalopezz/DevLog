import type { ReactNode } from 'react'
import {
  CircleUserRound,
  FolderKanban,
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

/**
 * 
 * Link para navegação no menu lateral. Usa NavLink do React Router para aplicar estilos
 */
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

  // Valida se o user está logado pela resposta do hook useGetUser. 
  // O loader da rota privada continua sendo a barreira de acesso.
  const isAuthenticated = Boolean(user)

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center px-2 py-2">
          {/* A versão horizontal mantém o nome legível na largura limitada da sidebar. */}
          <img
            alt="DevLog"
            className="h-16 w-auto object-contain"
            src="/logo_horizontal.png"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isAuthenticated ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarLink end to="/">
                  <CircleUserRound />
                  <span>Início</span>
                </SidebarLink>
              </SidebarMenu>
              <SidebarMenu>
                <SidebarLink end to="/projects">
                  <FolderKanban />
                  <span>Projetos</span>
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
            {/* A conta fica no rodapé, como acontece em apps com navegação
                lateral: a área principal concentra páginas e o rodapé
                concentra ações relacionadas à sessão. */}
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

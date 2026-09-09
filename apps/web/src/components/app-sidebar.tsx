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
 * Sidebar navigation link. Uses React Router NavLink to apply active styles
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

  // Determines whether the user is signed in from the useGetUser response. 
  // The private route loader remains responsible for access control.
  const isAuthenticated = Boolean(user)

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center px-2 py-2">
          {/* The horizontal version keeps the name readable within the narrow sidebar. */}
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
                  <span>Home</span>
                </SidebarLink>
              </SidebarMenu>
              <SidebarMenu>
                <SidebarLink end to="/projects">
                  <FolderKanban />
                  <span>Projects</span>
                </SidebarLink>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel>Access</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarLink to="/login">
                  <LogIn />
                  <span>Sign in</span>
                </SidebarLink>

                <SidebarLink to="/register">
                  <UserPlus />
                  <span>Create account</span>
                </SidebarLink>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Avoids an empty interface while the session is being
            checked. The private route is still protected by its loader. */}
        {isPending ? (
          <p className="px-4 text-sm text-muted-foreground">
            Checking session...
          </p>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        {user ? (
          <SidebarMenu>
            {/* The account sits in the footer, as in apps with sidebar
                navigation: the main area groups pages and the footer
                groups session actions. */}
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
                <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  )
}

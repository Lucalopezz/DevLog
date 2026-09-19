import type { ComponentType, ReactNode } from "react";
import {
  Activity,
  Archive,
  BarChart3,
  BookOpen,
  Boxes,
  CircleUserRound,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Cpu,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  Link2,
  LogIn,
  LogOut,
  Plus,
  Search,
  Server,
  Settings2,
  Tags,
  Terminal,
  UserPlus,
} from "lucide-react";
import { NavLink } from "react-router";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGetUser } from "@/features/auth/hooks/use-get-user";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/**
 * A sidebar item can be a real route or a visual placeholder for a planned
 * feature. Keeping both variants in the same model makes the product map easy
 * to scan and avoids adding broken links before their routes exist.
 */
type SidebarItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  to?: string;
  end?: boolean;
  planned?: boolean;
};

type SidebarSection = {
  label: string;
  items: SidebarItem[];
};

const sidebarSections: SidebarSection[] = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", icon: LayoutDashboard, to: "/", end: true },
      {
        label: "Technical Journal",
        icon: BookOpen,
        to: "/technical-entries",
        end: true,
      },
      { label: "Projects", icon: FolderKanban, to: "/projects", end: true },
      { label: "Quick Capture", icon: Plus, planned: true },
    ],
  },
  {
    label: "Journal",
    items: [
      { label: "All Entries", icon: BookOpen, planned: true },
      { label: "Open Issues", icon: CircleAlert, planned: true },
      { label: "Learnings", icon: Lightbulb, planned: true },
      { label: "Resolved Issues", icon: CircleCheck, planned: true },
      {
        label: "Archived Entries",
        icon: Archive,
        to: "/technical-entries/archived",
        end: true,
      },
      { label: "Search & Filters", icon: Search, planned: true },
    ],
  },
  {
    label: "Project Knowledge",
    items: [
      { label: "Tags", icon: Tags, to: "/tags", end: true },
      { label: "Technologies", icon: Cpu, planned: true },
      { label: "Commands", icon: Terminal, planned: true },
      { label: "Links & Resources", icon: Link2, planned: true },
      { label: "Environments", icon: Boxes, planned: true },
      { label: "Services", icon: Server, planned: true },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Activity Timeline", icon: Activity, planned: true },
      { label: "Knowledge Overview", icon: BarChart3, planned: true },
    ],
  },
];

function closeMobileSidebar(isMobile: boolean) {
  if (!isMobile) return;

  // The generated sidebar owns its drawer state. Reusing its public trigger
  // keeps route links independent from Radix's dialog context and also makes
  // resizing between desktop and mobile safe.
  document
    .querySelector<HTMLButtonElement>('[data-sidebar="trigger"]')
    ?.click();
}

function SidebarItemLink({ item }: { item: SidebarItem }) {
  const Icon = item.icon;
  const isMobile = useIsMobile();

  if (item.planned || !item.to) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          aria-disabled="true"
          disabled
          tooltip={`${item.label} — coming soon`}
        >
          <Icon />
          <span>{item.label}</span>
        </SidebarMenuButton>
        <SidebarMenuBadge>Soon</SidebarMenuBadge>
      </SidebarMenuItem>
    );
  }

  const link = (
    <NavLink
      end={item.end}
      to={item.to}
      onClick={() => closeMobileSidebar(isMobile)}
      className={({ isActive }) =>
        cn(
          "w-full",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
        )
      }
    >
      <Icon />
      <span>{item.label}</span>
    </NavLink>
  );

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        {link}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarLink({
  to,
  children,
  end = false,
}: {
  to: string;
  children: ReactNode;
  end?: boolean;
}) {
  const isMobile = useIsMobile();
  const link = (
    <NavLink
      end={end}
      to={to}
      onClick={() => closeMobileSidebar(isMobile)}
      className={({ isActive }) =>
        cn(
          "w-full",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
        )
      }
    >
      {children}
    </NavLink>
  );
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        {link}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { data: user, isPending } = useGetUser();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  // Determines whether the user is signed in from the useGetUser response.
  // The private route loader remains responsible for access control.
  const isAuthenticated = Boolean(user);

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
          sidebarSections.map((section) => (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarItemLink item={item} key={item.label} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))
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
              <SidebarMenuButton disabled tooltip="Settings — coming soon">
                <Settings2 />
                <span>Settings</span>
              </SidebarMenuButton>
              <SidebarMenuBadge>Soon</SidebarMenuBadge>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                disabled
                tooltip="Help & feedback — coming soon"
              >
                <CircleHelp />
                <span>Help & feedback</span>
              </SidebarMenuButton>
              <SidebarMenuBadge>Soon</SidebarMenuBadge>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                disabled={isLoggingOut}
                onClick={() => logout()}
                type="button"
              >
                <LogOut />
                <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}

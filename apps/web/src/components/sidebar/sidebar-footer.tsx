import { CircleUserRound, LogOut, Settings2 } from "lucide-react";

import { useLogout } from "@/features/auth/hooks/use-logout";
import type { User } from "@/features/auth/types/auth";
import {
  SidebarFooter as SidebarFooterPrimitive,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { HelpFeedbackDialog } from "./help-feedback-dialog";
import { SidebarRouteLink } from "./sidebar-item";

export function AppSidebarFooter({ user }: { user: User }) {
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  return (
    <SidebarFooterPrimitive>
      <SidebarMenu>
        {/* Keep the account near session actions, separate from page navigation. */}
        <SidebarRouteLink to="/account">
          <CircleUserRound />
          <span className="truncate">{user.name}</span>
        </SidebarRouteLink>

        <SidebarMenuItem>
          <SidebarRouteLink to="/settings">
            <Settings2 />
            <span>Settings</span>
          </SidebarRouteLink>
        </SidebarMenuItem>

        <HelpFeedbackDialog />

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
    </SidebarFooterPrimitive>
  );
}

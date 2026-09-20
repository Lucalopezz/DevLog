import { useState } from "react";
import { useGetUser } from "@/features/auth/hooks/use-get-user";
import { TechnicalEntryForm } from "@/features/technical-entry/components/technical-entry-form";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { AppSidebarFooter } from "./sidebar/sidebar-footer";
import {
  SidebarAccessNavigation,
  SidebarNavigation,
} from "./sidebar/sidebar-navigation";

export function AppSidebar() {
  const { data: user, isPending } = useGetUser();
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

  return (
    <>
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
          {/* Wait for the user query so a loading session does not look signed out. */}
          {isPending ? (
            <p className="px-4 text-sm text-muted-foreground">
              Checking session...
            </p>
          ) : user ? (
            <SidebarNavigation
              onQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          ) : (
            <SidebarAccessNavigation />
          )}
        </SidebarContent>

        {user ? <AppSidebarFooter user={user} /> : null}
      </Sidebar>
      {user ? (
        <TechnicalEntryForm
          open={isQuickCaptureOpen}
          onOpenChange={setIsQuickCaptureOpen}
        />
      ) : null}
    </>
  );
}

import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { SidebarItem as SidebarItemModel } from "./sidebar-types";
import { isSidebarRouteActive, matchesSidebarPathname } from "./sidebar-utils";

function closeMobileSidebar(isMobile: boolean) {
  if (!isMobile) return;

  // The sidebar primitive does not export its state hook, so use its existing
  // public trigger to close the mobile drawer after navigation.
  document
    .querySelector<HTMLButtonElement>('[data-sidebar="trigger"]')
    ?.click();
}

type SidebarRouteLinkProps = {
  to: string;
  children: ReactNode;
  end?: boolean;
  isActive?: boolean;
};

export function SidebarRouteLink({
  to,
  children,
  end = false,
  isActive,
}: SidebarRouteLinkProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const active = isActive ?? matchesSidebarPathname(to, location, end);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link
          aria-current={active ? "page" : undefined}
          className={cn(
            "w-full",
            active && "bg-sidebar-accent text-sidebar-accent-foreground",
          )}
          onClick={() => closeMobileSidebar(isMobile)}
          to={to}
        >
          {children}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function SidebarItem({
  item,
  onQuickCapture,
}: {
  item: SidebarItemModel;
  onQuickCapture: () => void;
}) {
  const Icon = item.icon;
  const isMobile = useIsMobile();
  const location = useLocation();

  switch (item.type) {
    case "route":
      return (
        <SidebarRouteLink
          end={item.end}
          isActive={isSidebarRouteActive(item, location)}
          to={item.to}
        >
          <Icon />
          <span>{item.label}</span>
        </SidebarRouteLink>
      );
    case "action":
      return (
        <SidebarMenuItem>
          <SidebarMenuButton
            className="cursor-pointer"
            onClick={() => {
              onQuickCapture();
              closeMobileSidebar(isMobile);
            }}
            type="button"
          >
            <Icon />
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    case "planned":
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
}

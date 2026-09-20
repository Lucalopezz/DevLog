import { LogIn, UserPlus } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { sidebarSections } from "./sidebar-config";
import { SidebarItem, SidebarRouteLink } from "./sidebar-item";

export function SidebarNavigation({
  onQuickCapture,
}: {
  onQuickCapture: () => void;
}) {
  return sidebarSections.map((section) => (
    <SidebarGroup key={section.label}>
      <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {section.items.map((item) => (
            <SidebarItem
              item={item}
              key={item.label}
              onQuickCapture={onQuickCapture}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}

export function SidebarAccessNavigation() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Access</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarRouteLink to="/login">
            <LogIn />
            <span>Sign in</span>
          </SidebarRouteLink>
          <SidebarRouteLink to="/register">
            <UserPlus />
            <span>Create account</span>
          </SidebarRouteLink>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

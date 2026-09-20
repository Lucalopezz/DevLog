import type { ComponentType } from "react";
import type { Location } from "react-router";

type BaseSidebarItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export type SidebarRouteItem = BaseSidebarItem & {
  type: "route";
  to: string;
  end?: boolean;
  match?: (location: Location) => boolean;
};

export type SidebarActionItem = BaseSidebarItem & {
  type: "action";
  action: "quickCapture";
};

export type SidebarPlannedItem = BaseSidebarItem & {
  type: "planned";
};

export type SidebarItem =
  | SidebarRouteItem
  | SidebarActionItem
  | SidebarPlannedItem;

export type SidebarSection = {
  label: string;
  items: SidebarItem[];
};

import {
  Activity,
  Archive,
  BarChart3,
  BookOpen,
  Boxes,
  CircleAlert,
  CircleCheck,
  Cpu,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  Plus,
  Tags,
} from "lucide-react";
import type { SidebarSection } from "./sidebar-types";
import { matchTechnicalEntries } from "./sidebar-utils";

export const sidebarSections: SidebarSection[] = [
  {
    label: "Workspace",
    items: [
      {
        type: "route",
        label: "Overview",
        icon: LayoutDashboard,
        to: "/",
        end: true,
      },
      {
        type: "route",
        label: "Projects",
        icon: FolderKanban,
        to: "/projects",
        end: true,
      },
      {
        type: "action",
        label: "Quick Capture",
        icon: Plus,
        action: "quickCapture",
      },
    ],
  },
  {
    label: "Journal",
    items: [
      {
        type: "route",
        label: "All Entries",
        icon: BookOpen,
        to: "/technical-entries",
        end: true,
        match: matchTechnicalEntries(),
      },
      {
        type: "route",
        label: "Open Issues",
        icon: CircleAlert,
        to: "/technical-entries?type=ISSUE&status=OPEN",
        end: true,
        match: matchTechnicalEntries({ type: "ISSUE", status: "OPEN" }),
      },
      {
        type: "route",
        label: "Learnings",
        icon: Lightbulb,
        to: "/technical-entries?type=LEARNING",
        end: true,
        match: matchTechnicalEntries({ type: "LEARNING" }),
      },
      {
        type: "route",
        label: "Resolved Issues",
        icon: CircleCheck,
        to: "/technical-entries?type=ISSUE&status=RESOLVED",
        end: true,
        match: matchTechnicalEntries({ type: "ISSUE", status: "RESOLVED" }),
      },
      {
        type: "route",
        label: "Archived Entries",
        icon: Archive,
        to: "/technical-entries/archived",
        end: true,
      },
    ],
  },
  {
    label: "Project Knowledge",
    items: [
      { type: "route", label: "Tags", icon: Tags, to: "/tags", end: true },
      { type: "planned", label: "Technologies", icon: Cpu },
      { type: "planned", label: "Environments", icon: Boxes },
    ],
  },
  {
    label: "Insights",
    items: [
      { type: "planned", label: "Activity Timeline", icon: Activity },
      { type: "planned", label: "Knowledge Overview", icon: BarChart3 },
    ],
  },
];

import {
  BookOpen,
  ExternalLink,
  FileCode2,
  GitBranch,
  Globe2,
} from "lucide-react";
import type { ProjectStatus } from "./types/project";
import type { ProjectResourceType } from "./types/project-detail";

export type ProjectStatusPresentation = {
  label: string;
  className: string;
};

/**
 * Maps domain values to interface presentation choices.
 *
 * The API still uses ACTIVE, INACTIVE, and FINISHED. The component
 * does not need to know these details or scatter conditionals across the screen;
 * it reads this map to get display text and CSS classes.
 */
export const projectStatusPresentation: Record<
  ProjectStatus,
  ProjectStatusPresentation
> = {
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  INACTIVE: {
    label: "Inactive",
    className: "bg-muted text-muted-foreground",
  },
  FINISHED: {
    label: "Finished",
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
};
/**
 *Takes a project status and returns its display text and CSS classes.
 * */
export function presentProjectStatus(
  status: ProjectStatus,
): ProjectStatusPresentation {
  return projectStatusPresentation[status];
}

export const resourcePresentation: Record<
  ProjectResourceType,
  { label: string; icon: typeof Globe2 }
> = {
  REPOSITORY: { label: "Repository", icon: GitBranch },
  DOCUMENTATION: { label: "Documentation", icon: BookOpen },
  LOCAL_URL: { label: "Local URL", icon: FileCode2 },
  EXTERNAL_URL: { label: "External link", icon: Globe2 },
  OTHER: { label: "Resource", icon: ExternalLink },
};

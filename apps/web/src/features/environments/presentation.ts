import type { ProjectEnvironmentCategory } from "./types/environment";

const labels: Record<ProjectEnvironmentCategory, string> = {
  LOCAL: "Local",
  DEVELOPMENT: "Development",
  TESTING: "Testing",
  STAGING: "Staging",
  PRODUCTION: "Production",
  OTHER: "Other",
};
export function environmentCategoryLabel(
  category: ProjectEnvironmentCategory,
): string {
  return labels[category];
}
export function environmentRuntimeSummary(
  runtime: string | null,
  version: string | null,
): string {
  return runtime
    ? [runtime, version].filter(Boolean).join(" ")
    : "Runtime not specified";
}

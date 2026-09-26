import type { Pagination } from "@/api/types";

export const environmentCategories = [
  "LOCAL",
  "DEVELOPMENT",
  "TESTING",
  "STAGING",
  "PRODUCTION",
  "OTHER",
] as const;
export type ProjectEnvironmentCategory = (typeof environmentCategories)[number];
export type ProjectEnvironment = {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  category: ProjectEnvironmentCategory;
  operatingSystem: string | null;
  runtime: string | null;
  runtimeVersion: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};
export type EnvironmentCollection = Pagination<ProjectEnvironment>;
export type ListEnvironmentsParams = {
  search?: string;
  category?: ProjectEnvironmentCategory;
  projectId?: string;
  page?: number;
  perPage?: number;
  sort?: "name" | "category" | "projectName" | "createdAt" | "updatedAt";
  sortDir?: "asc" | "desc";
};
export type EnvironmentInput = {
  name: string;
  category: ProjectEnvironmentCategory;
  operatingSystem?: string;
  runtime?: string;
  runtimeVersion?: string;
  description?: string;
};
export type EnvironmentUpdateInput = Partial<
  Omit<
    EnvironmentInput,
    "operatingSystem" | "runtime" | "runtimeVersion" | "description"
  >
> & {
  operatingSystem?: string | null;
  runtime?: string | null;
  runtimeVersion?: string | null;
  description?: string | null;
};

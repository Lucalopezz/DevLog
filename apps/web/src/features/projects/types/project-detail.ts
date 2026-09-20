import type { Pagination } from "@/api/types";
export type ProjectCommand = {
  id: string;
  projectId: string;
  title: string;
  command: string;
  description?: string;
  executionOrder?: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectCommandInput = {
  title: string;
  command: string;
  description?: string;
  executionOrder?: number;
};

export type UpdateProjectCommandInput = {
  title: string;
  command: string;
  description: string | null;
  executionOrder: number | null;
};

export type ProjectDetailListParams = {
  page?: number;
  perPage?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
  archivedAt?: string;
};

export type ProjectResourceType =
  "REPOSITORY" | "DOCUMENTATION" | "LOCAL_URL" | "EXTERNAL_URL" | "OTHER";

export type ProjectResource = {
  id: string;
  projectId: string;
  label: string;
  url: string;
  type: ProjectResourceType;
  createdAt: string;
  updatedAt: string;
};

export type ProjectCommandCollection = Pagination<ProjectCommand>;
export type ProjectResourceCollection = Pagination<ProjectResource>;

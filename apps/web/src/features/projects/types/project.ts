import type { Pagination } from "@/api/types";

export type ProjectStatus = "ACTIVE" | "INACTIVE" | "FINISHED";

export type ProjectTechnology = {
  id: string;
  name: string;
  version?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Validates values from external sources, such as URLSearchParams or a
 * <select> element. After this check, TypeScript can safely treat them
 * as ProjectStatus.
 */
export function isProjectStatus(
  value: string | null | undefined,
): value is ProjectStatus {
  return (
    value === "ACTIVE" || value === "INACTIVE" || value === "FINISHED"
  );
}

export type Project = {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  technologies?: ProjectTechnology[];
  localPath?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectCollection = Pagination<Project>;

/**
 * Parameters the frontend can send to GET /api/project.
 *
 * userId is omitted because the backend derives the authenticated user
 * from the session; the browser must not choose the owner.
 * archivedAt is a string because it is serialized in the query string. The
 * special value "null" represents unarchived projects in the API.
 */
export type ListProjectsParams = {
  page?: number;
  perPage?: number;
  name?: string;
  status?: ProjectStatus;
  archivedAt?: string;
  sort?: "createdAt" | "updatedAt" | "name";
  sortDir?: "asc" | "desc";
};

/** Values edited in the form before conversion to query parameters. */
export type ProjectSearchFormValues = {
  name: string;
  status: ProjectStatus | "";
};

export type CreateProjectInput = {
  name: string;
  description?: string;
};

/**
 * Direct fields accepted by the PATCH endpoint.
 *
 * The contract is intentionally partial: omission preserves the current value and
 * `null` clears optional fields. Lifecycle transitions, such as
 * archiving and restoring, are not part of this payload.
 */
export type UpdateProjectInput = {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  localPath?: string | null;
};

export type UpdateProjectFormValues = {
  name: string;
  description: string;
  status: ProjectStatus;
  localPath: string;
};

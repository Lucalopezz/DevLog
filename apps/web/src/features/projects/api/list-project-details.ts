import { api } from "@/api/http";
import type {
  ProjectCommandCollection,
  ProjectDetailListParams,
  ProjectResourceCollection,
} from "../types/project-detail";
import type { TechnicalEntryCollection } from "@/features/technical-entry/types/technical-entry";

const defaultParams = {
  page: 1,
  perPage: 6,
} satisfies ProjectDetailListParams;

/**
 * Factory for the React Query keys used in the project details page.
 *
 * React Query identifies cached data by its `queryKey`, so these helpers keep
 * all project-detail keys consistent and hierarchical.
 *
 * Examples:
 *
 * projectDetailKeys.all("123")
 * ["project", "123", "details"]
 *
 * projectDetailKeys.commands("123", { page: 1 })
 * ["project", "123", "details", "commands", { page: 1 }]
 *
 * projectDetailKeys.commands("123", { page: 2 })
 * ["project", "123", "details", "commands", { page: 2 }]
 *
 * Including `params` in the key is important because different pages,
 * filters, or searches represent different cached requests.
 *
 * The hierarchical structure also makes invalidation easier. For example:
 *
 * queryClient.invalidateQueries({
 *   queryKey: projectDetailKeys.all("123"),
 * });
 *
 * This can invalidate all queries that start with:
 * ["project", "123", "details"]
 *
 * such as technical entries, commands, and resources for that project.
 *
 * `as const` preserves each key as a readonly tuple, giving TypeScript more
 * precise information about the structure of the query key.
 */
export const projectDetailKeys = {
  all: (projectId: string) => ["project", projectId, "details"] as const,

  technicalEntries: (projectId: string, params: ProjectDetailListParams) =>
    [...projectDetailKeys.all(projectId), "technical-entries", params] as const,

  commands: (projectId: string, params: ProjectDetailListParams) =>
    [...projectDetailKeys.all(projectId), "commands", params] as const,

  resources: (projectId: string, params: ProjectDetailListParams) =>
    [...projectDetailKeys.all(projectId), "resources", params] as const,
};

export async function listProjectTechnicalEntries(
  projectId: string,
  params: ProjectDetailListParams = defaultParams,
): Promise<TechnicalEntryCollection> {
  const { data } = await api.get<TechnicalEntryCollection>(
    `/project/${projectId}/technical-entries`,
    // The API uses the special string "null" to represent unarchived
    // entries; this keeps the filter aligned with the backend contract.
    { params: { ...defaultParams, ...params, archivedAt: "null" } },
  );

  return data;
}

export async function listProjectCommands(
  projectId: string,
  params: ProjectDetailListParams = defaultParams,
): Promise<ProjectCommandCollection> {
  const { data } = await api.get<ProjectCommandCollection>(
    `/project/${projectId}/commands`,
    { params: { ...defaultParams, ...params } },
  );

  return data;
}

export async function listProjectResources(
  projectId: string,
  params: ProjectDetailListParams = defaultParams,
): Promise<ProjectResourceCollection> {
  const { data } = await api.get<ProjectResourceCollection>(
    `/project/${projectId}/resources`,
    { params: { ...defaultParams, ...params } },
  );

  return data;
}

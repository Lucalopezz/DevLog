import { useQuery } from "@tanstack/react-query";
import {
  listProjectCommands,
  listProjectResources,
  listProjectTechnicalEntries,
  projectDetailKeys,
} from "../api/list-project-details";

const projectDetailParams = {
  page: 1,
  perPage: 6,
} as const;

/**
 * Each query uses its own key because collections have different
 * lifecycles. Updating commands does not need to invalidate technologies or
 * technical entries accidentally.
 */
export function useProjectTechnicalEntries(projectId: string, page = 1) {
  const params = { ...projectDetailParams, page };

  return useQuery({
    // The page is part of the key so React Query can cache each page
    // and return to it without mixing entries from different pages.
    queryKey: projectDetailKeys.technicalEntries(projectId, params),
    queryFn: () => listProjectTechnicalEntries(projectId, params),
    // Avoids an invalid call while route parameters are being resolved.
    // Enabled is false when projectId is an empty string, null, or undefined
    enabled: Boolean(projectId),
    retry: false,
  });
}

export function useProjectCommands(projectId: string, page = 1) {
  const params = { ...projectDetailParams, page };

  return useQuery({
    // Commands use their own key so they can be invalidated without affecting
    // other project collections.
    queryKey: projectDetailKeys.commands(projectId, params),
    queryFn: () => listProjectCommands(projectId, params),
    enabled: Boolean(projectId),
    retry: false,
  });
}

export function useProjectResources(projectId: string, page = 1) {
  const params = { ...projectDetailParams, page };

  return useQuery({
    // The same strategy applies to resources, keeping the hook simple and
    // making coordination between API, cache, and component explicit.
    queryKey: projectDetailKeys.resources(projectId, params),
    queryFn: () => listProjectResources(projectId, params),
    enabled: Boolean(projectId),
    retry: false,
  });
}

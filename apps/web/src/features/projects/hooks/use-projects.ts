import { useQuery } from "@tanstack/react-query";
import { listProjects, projectsKeys } from "../api/list-projects";
import type { ListProjectsParams } from "../types/project";

export function useProjects(params: ListProjectsParams) {
  return useQuery({
    queryFn: () => listProjects(params),
    queryKey: projectsKeys.list(params),
  })
}

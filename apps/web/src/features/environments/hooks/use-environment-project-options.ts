import { useQuery } from "@tanstack/react-query";
import {
  listProjects,
  projectsKeys,
} from "@/features/projects/api/list-projects";
import type { Project } from "@/features/projects/types/project";

export function useEnvironmentProjectOptions() {
  return useQuery({
    queryKey: [...projectsKeys.lists(), "environment-options"],
    queryFn: async (): Promise<Project[]> => {
      const projects: Project[] = [];
      // The project filter must include every owned project, even past the
      // first page of the regular project list.
      for (let page = 1; ; page += 1) {
        const result = await listProjects({
          page,
          perPage: 100,
          sort: "name",
          sortDir: "asc",
        });
        projects.push(...result.data);
        if (page >= result.meta.lastPage) break;
      }
      return projects;
    },
  });
}

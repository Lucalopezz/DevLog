import { api } from "@/api/http";
import type { ListProjectsParams, ProjectCollection } from "../types/project";

export async function listProjects(params: ListProjectsParams): Promise<ProjectCollection> {
  const response = await api.get<ProjectCollection>('/project', { params });
  return response.data;
}


/**
 *Cria chaves como:
 *['projects', 'lists', 'list', { page: 1, name: 'api' }]
 *['projects', 'lists', 'list', { page: 2, name: 'api' }]
 *
 * The first represents page 1. The second represents page 2. 
 * React Query therefore caches each result separately.
 *
 * */
export const projectsKeys = {
  all: ['projects'] as const,

  lists: () => [...projectsKeys.all, 'lists'] as const,

  list: (params: ListProjectsParams) =>
    [...projectsKeys.lists(), 'list', params] as const,
};

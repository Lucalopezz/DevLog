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
 * A primeira representa a página 1. A segunda representa a página 2. 
 * Portanto, o React Query mantém cada resultado no cache separadamente.
 *
 * */
export const projectsKeys = {
  all: ['projects'] as const,

  lists: () => [...projectsKeys.all, 'lists'] as const,

  list: (params: ListProjectsParams) =>
    [...projectsKeys.lists(), 'list', params] as const,
};

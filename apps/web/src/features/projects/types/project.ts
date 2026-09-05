import type { Pagination } from '@/api/types';

export type ProjectStatus = 'ACTIVE' | 'INACTIVE' | 'FINISHED';

export type Project = {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  localPath?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectCollection = Pagination<Project>;

/**
 * Parâmetros que o frontend pode enviar para GET /api/project.
 *
 * userId não aparece aqui porque o usuário autenticado é aplicado pelo
 * backend a partir da sessão; o navegador não deve escolher o proprietário.
 * archivedAt é string porque será serializado na query string. O valor
 * especial "null" representa projetos não arquivados na API.
 */
export type ListProjectsParams = {
  page?: number;
  perPage?: number;
  name?: string;
  status?: ProjectStatus;
  archivedAt?: string;
  sort?: 'createdAt' | 'updatedAt' | 'name';
  sortDir?: 'asc' | 'desc';
};

export type CreateProjectInput = {
  name: string; description?: string;
};

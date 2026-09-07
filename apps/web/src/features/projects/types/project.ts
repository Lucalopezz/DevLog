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
 * Valida valores que vieram de fontes externas, como URLSearchParams ou um
 * elemento <select>. Depois desta verificação, o TypeScript pode tratá-los
 * como ProjectStatus com segurança.
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
  sort?: "createdAt" | "updatedAt" | "name";
  sortDir?: "asc" | "desc";
};

/** Valores editados no formulário antes de serem convertidos em query params. */
export type ProjectSearchFormValues = {
  name: string;
  status: ProjectStatus | "";
};

export type CreateProjectInput = {
  name: string;
  description?: string;
};

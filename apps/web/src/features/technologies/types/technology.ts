import type { Pagination } from "@/api/types";

export type TechnologyListItem = {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  version?: string;
  createdAt: string;
  updatedAt: string;
};

export type ListTechnologiesParams = {
  page?: number;
  perPage?: number;
  name?: string;
  projectId?: string;
};

export type TechnologyCollection = Pagination<TechnologyListItem>;

export type CreateProjectTechnologyInput = {
  name: string;
  version?: string;
};

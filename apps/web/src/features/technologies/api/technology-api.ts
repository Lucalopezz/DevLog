import { api } from "@/api/http";
import type { Project } from "@/features/projects/types/project";
import type {
  CreateProjectTechnologyInput,
  ListTechnologiesParams,
  TechnologyCollection,
} from "../types/technology";

export const technologiesKeys = {
  all: ["technologies"] as const,
  lists: () => [...technologiesKeys.all, "lists"] as const,
  list: (params: ListTechnologiesParams) =>
    [...technologiesKeys.lists(), params] as const,
};

export async function listTechnologies(
  params: ListTechnologiesParams,
): Promise<TechnologyCollection> {
  const { data } = await api.get<TechnologyCollection>(
    "/project/technologies",
    {
      params,
    },
  );

  return data;
}

export async function addProjectTechnology(
  projectId: string,
  input: CreateProjectTechnologyInput,
): Promise<Project> {
  const { data } = await api.post<Project>(
    `/project/${projectId}/technologies`,
    input,
  );

  return data;
}

export async function removeProjectTechnology({
  projectId,
  technologyId,
}: {
  projectId: string;
  technologyId: string;
}): Promise<void> {
  await api.delete(`/project/${projectId}/technologies/${technologyId}`);
}

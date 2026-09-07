import { api } from "@/api/http";
import type { Project } from "../types/project";

export const getProjectQueryKey = (projectId: string) => ["project", projectId];

export async function getProject(projectId: string): Promise<Project> {
  const { data } = await api.get<Project>(`/project/${projectId}`);
  return data;
}

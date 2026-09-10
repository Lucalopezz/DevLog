import { api } from "@/api/http";
import type { Project } from "../types/project";
export async function archiveProject(projectId: string): Promise<Project> {
  const { data } = await api.patch<Project>(`/project/${projectId}/archive`);

  return data;
}

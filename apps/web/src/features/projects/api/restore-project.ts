import { api } from "@/api/http";
import type { Project } from "../types/project";

export async function restoreProject(projectId: string): Promise<Project> {
  const { data } = await api.patch<Project>(
    `/project/${projectId}/restore`,
  );

  return data;
}

import { api } from "@/api/http";

export async function deleteProject(projectId: string): Promise<void> {
  await api.delete(`/project/${projectId}`);
}

import { api } from "@/api/http";

export async function deleteProjectResource(
  projectId: string,
  resourceId: string,
): Promise<void> {
  await api.delete(`/project/${projectId}/resources/${resourceId}`);
}

import { api } from "@/api/http";

export async function deleteProjectCommand(
  projectId: string,
  commandId: string,
): Promise<void> {
  await api.delete(`/project/${projectId}/commands/${commandId}`);
}

import { api } from "@/api/http";
import type {
  ProjectResource,
  UpdateProjectResourceInput,
} from "../types/project-detail";

export async function updateProjectResource(
  projectId: string,
  resourceId: string,
  input: UpdateProjectResourceInput,
): Promise<ProjectResource> {
  const { data } = await api.patch<ProjectResource>(
    `/project/${projectId}/resources/${resourceId}`,
    input,
  );
  return data;
}

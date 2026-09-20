import { api } from "@/api/http";
import type {
  ProjectResource,
  ProjectResourceInput,
} from "../types/project-detail";

export async function createProjectResource(
  projectId: string,
  input: ProjectResourceInput,
): Promise<ProjectResource> {
  const { data } = await api.post<ProjectResource>(
    `/project/${projectId}/resources`,
    input,
  );
  return data;
}

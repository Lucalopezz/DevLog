import { api } from "@/api/http";
import type {
  ProjectCommand,
  ProjectCommandInput,
} from "../types/project-detail";

export async function createProjectCommand(
  projectId: string,
  input: ProjectCommandInput,
): Promise<ProjectCommand> {
  const { data } = await api.post<ProjectCommand>(
    `/project/${projectId}/commands`,
    input,
  );
  return data;
}

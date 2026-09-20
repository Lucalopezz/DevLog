import { api } from "@/api/http";
import type {
  ProjectCommand,
  UpdateProjectCommandInput,
} from "../types/project-detail";

export async function updateProjectCommand(
  projectId: string,
  commandId: string,
  input: UpdateProjectCommandInput,
): Promise<ProjectCommand> {
  const { data } = await api.patch<ProjectCommand>(
    `/project/${projectId}/commands/${commandId}`,
    input,
  );
  return data;
}

import { api } from "@/api/http";
import type { CreateProjectInput, Project } from "../types/project";

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const { data } = await api.post<Project>("/project", input);
  return data;
}

import { api } from "@/api/http";
import type {
  EnvironmentCollection,
  EnvironmentInput,
  EnvironmentUpdateInput,
  ListEnvironmentsParams,
  ProjectEnvironment,
} from "../types/environment";

export const environmentKeys = {
  all: ["environments"] as const,
  lists: () => [...environmentKeys.all, "lists"] as const,
  list: (params: ListEnvironmentsParams) =>
    [...environmentKeys.lists(), params] as const,
  project: (projectId: string) =>
    [...environmentKeys.all, "project", projectId] as const,
  projectList: (projectId: string, params: ListEnvironmentsParams) =>
    [...environmentKeys.project(projectId), params] as const,
};

export async function listEnvironments(
  params: ListEnvironmentsParams,
): Promise<EnvironmentCollection> {
  const { data } = await api.get<EnvironmentCollection>(
    "/project/environments",
    { params },
  );
  return data;
}
export async function listProjectEnvironments(
  projectId: string,
  params: ListEnvironmentsParams,
): Promise<EnvironmentCollection> {
  const { data } = await api.get<EnvironmentCollection>(
    `/project/${projectId}/environments`,
    { params },
  );
  return data;
}
export async function createProjectEnvironment(
  projectId: string,
  input: EnvironmentInput,
): Promise<ProjectEnvironment> {
  const { data } = await api.post<ProjectEnvironment>(
    `/project/${projectId}/environments`,
    input,
  );
  return data;
}
export async function updateProjectEnvironment(
  projectId: string,
  environmentId: string,
  input: EnvironmentUpdateInput,
): Promise<ProjectEnvironment> {
  const { data } = await api.patch<ProjectEnvironment>(
    `/project/${projectId}/environments/${environmentId}`,
    input,
  );
  return data;
}
export async function deleteProjectEnvironment(
  projectId: string,
  environmentId: string,
): Promise<void> {
  await api.delete(`/project/${projectId}/environments/${environmentId}`);
}

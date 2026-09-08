import { api } from '@/api/http'
import type { Project, UpdateProjectInput } from '../types/project'

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const { data } = await api.patch<Project>(`/project/${projectId}`, input)
  return data
}

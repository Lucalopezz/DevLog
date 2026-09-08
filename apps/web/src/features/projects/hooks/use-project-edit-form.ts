import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { updateProjectSchema } from '../schemas/project.schema'
import type { Project, UpdateProjectFormValues } from '../types/project'

export function useProjectEditForm(project: Project) {
  return useForm<UpdateProjectFormValues>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description ?? '',
      status: project.status,
      localPath: project.localPath ?? '',
    },
  })
}

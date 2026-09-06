import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { createProjectSchema } from '../schemas/project.schema'
import type { CreateProjectInput } from '../types/project'

export function useProjectForm() {
  return useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })
}

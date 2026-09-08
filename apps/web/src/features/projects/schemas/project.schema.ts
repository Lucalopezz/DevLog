import { z } from 'zod'

const projectStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'FINISHED'])

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(150, 'Nome deve ter no máximo 150 caracteres'),
  description: z.string().optional(),
})

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(150, 'Nome deve ter no máximo 150 caracteres'),
  description: z.string(),
  status: projectStatusSchema,
  localPath: z.string(),
})

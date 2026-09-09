import { z } from 'zod'

const projectStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'FINISHED'])

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters long')
    .max(150, 'Name must be at most 150 characters long'),
  description: z.string().optional(),
})

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Name must be at least 3 characters long')
    .max(150, 'Name must be at most 150 characters long'),
  description: z.string(),
  status: projectStatusSchema,
  localPath: z.string(),
})

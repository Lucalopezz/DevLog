import { z } from "zod";

export const projectTechnologySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Technology name is required")
    .max(100, "Technology name must be at most 100 characters long"),
  version: z
    .string()
    .trim()
    .max(50, "Version must be at most 50 characters long")
    .optional(),
});

export type ProjectTechnologyFormValues = z.infer<
  typeof projectTechnologySchema
>;

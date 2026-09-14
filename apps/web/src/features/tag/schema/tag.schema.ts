import { z } from "zod";

export const tagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Tag name must be at least 3 characters long")
    .max(80, "Tag name must be at most 80 characters long"),
});

export type TagFormValues = z.infer<typeof tagSchema>;

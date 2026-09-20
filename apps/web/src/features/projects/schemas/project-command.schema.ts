import { z } from "zod";

export const projectCommandSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(120, "Title must be at most 120 characters long."),
  // Keep the original command text intact: spaces and line breaks can be
  // meaningful in shell commands, so validate without transforming it.
  command: z.string().refine((value) => value.trim().length > 0, {
    message: "Command is required.",
  }),
  description: z.string(),
  executionOrder: z.string().refine(
    (value) => value === "" || /^\d+$/.test(value),
    "Execution order must be a whole number greater than or equal to zero.",
  ),
});

export type ProjectCommandFormValues = z.infer<typeof projectCommandSchema>;

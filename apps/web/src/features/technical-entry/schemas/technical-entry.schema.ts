import { z } from "zod";

const technicalEntryTypeSchema = z.enum(["ISSUE", "LEARNING"]);

const titleSchema = z
  .string()
  .trim()
  .min(3, "Title must be at least 3 characters long")
  .max(200, "Title must be at most 200 characters long");

const contextSchema = z
  .string()
  .trim()
  .min(3, "Context must be at least 3 characters long");

// The form keeps an empty string for an unselected project. It is converted to
// undefined/null when the form is submitted, while non-empty values must be UUIDs.
const projectIdSchema = z
  .string()
  .refine(
    (value) => value === "" || z.uuid().safeParse(value).success,
    "Project ID must be a valid UUID",
  );

export const createTechnicalEntrySchema = z.object({
  title: titleSchema,
  projectId: projectIdSchema.nullable().optional(),
  context: contextSchema,
  type: technicalEntryTypeSchema,
  conclusion: z.string(),
});

export const updateTechnicalEntrySchema = z.object({
  title: titleSchema,
  context: contextSchema,
  conclusion: z.string(),
  projectId: projectIdSchema,
});

export type CreateTechnicalEntryFormValues = z.infer<
  typeof createTechnicalEntrySchema
>;

export type UpdateTechnicalEntryFormValues = z.infer<
  typeof updateTechnicalEntrySchema
>;

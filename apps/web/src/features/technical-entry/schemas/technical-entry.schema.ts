import { z } from "zod";

const technicalEntryTypeSchema = z.enum(["ISSUE", "LEARNING"]);

const titleSchema = z
  .string()
  .trim()
  .min(3, "Title must be at least 3 characters long")
  .max(200, "Title must be at most 200 characters long");

export const contextSchema = z
  .string()
  .trim()
  .min(3, "Context must be at least 3 characters long");

// Conclusion is optional from the domain perspective, so an empty string is
// valid inside forms. The submitters convert an empty value to `null` when
// they want to clear the persisted conclusion.
export const conclusionSchema = z.string();

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
  conclusion: conclusionSchema,
});

// The title is edited in the dialog, while the long-form content is edited
// inline on the detail page. Keeping a title-only schema prevents the dialog
// from validating fields that it no longer renders.
export const updateTechnicalEntryTitleSchema = z.object({
  title: titleSchema,
});

export const updateTechnicalEntrySchema = z.object({
  title: titleSchema,
  context: contextSchema,
  conclusion: conclusionSchema,
  projectId: projectIdSchema,
});

export type CreateTechnicalEntryFormValues = z.infer<
  typeof createTechnicalEntrySchema
>;

export type UpdateTechnicalEntryFormValues = z.infer<
  typeof updateTechnicalEntrySchema
>;

export type UpdateTechnicalEntryTitleFormValues = z.infer<
  typeof updateTechnicalEntryTitleSchema
>;

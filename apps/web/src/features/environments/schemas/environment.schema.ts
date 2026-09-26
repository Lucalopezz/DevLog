import { z } from "zod";
import {
  environmentCategories,
  type EnvironmentInput,
  type EnvironmentUpdateInput,
} from "../types/environment";

const optionalField = (maximum: number) =>
  z.string().trim().max(maximum, `Must be at most ${maximum} characters long.`);
export const environmentFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long.")
    .max(100, "Name must be at most 100 characters long."),
  category: z.enum(environmentCategories, {
    error: "Select a valid category.",
  }),
  operatingSystem: optionalField(100),
  runtime: optionalField(100),
  runtimeVersion: optionalField(50),
  description: optionalField(1000),
});
export type EnvironmentFormValues = z.infer<typeof environmentFormSchema>;

function optional(value: string): string | undefined {
  return value || undefined;
}
export function toCreateEnvironmentInput(
  values: EnvironmentFormValues,
): EnvironmentInput {
  return {
    name: values.name,
    category: values.category,
    operatingSystem: optional(values.operatingSystem),
    runtime: optional(values.runtime),
    runtimeVersion: optional(values.runtimeVersion),
    description: optional(values.description),
  };
}
export function toUpdateEnvironmentInput(
  values: EnvironmentFormValues,
): EnvironmentUpdateInput {
  // PATCH distinguishes omitted fields from an explicit clear; the edit form sends null.
  return {
    name: values.name,
    category: values.category,
    operatingSystem: values.operatingSystem || null,
    runtime: values.runtime || null,
    runtimeVersion: values.runtimeVersion || null,
    description: values.description || null,
  };
}

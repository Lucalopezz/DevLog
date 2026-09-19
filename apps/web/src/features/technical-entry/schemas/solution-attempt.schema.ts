import { z } from "zod";

const resultSchema = z.enum(["FAILED", "PARTIAL", "SUCCESSFUL"]);
const descriptionSchema = z.string().trim().min(1, "Description is required.");

export const addSolutionAttemptSchema = z.object({
  description: descriptionSchema,
  // The select starts empty in the form; the pipe validates that the chosen value belongs to the enum accepted by the API.
  result: z.string().min(1, "Select an outcome.").pipe(resultSchema),
});

export const updateSolutionAttemptSchema = z.object({
  description: descriptionSchema,
});

// Infer the input and output types from the schema to ensure they match the API expectations.
export type AddSolutionAttemptFormInput = z.input<
  typeof addSolutionAttemptSchema
>;

export type AddSolutionAttemptFormOutput = z.output<
  typeof addSolutionAttemptSchema
>;

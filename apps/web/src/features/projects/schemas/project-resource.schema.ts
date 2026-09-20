import { z } from "zod";

const resourceTypes = [
  "REPOSITORY",
  "DOCUMENTATION",
  "LOCAL_URL",
  "EXTERNAL_URL",
  "OTHER",
] as const;

export const projectResourceSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Label is required.")
    .max(120, "Label must be at most 120 characters long."),
  url: z
    .string()
    .trim()
    .min(1, "URL is required.")
    .refine((value) => {
      try {
        const parsed = new URL(value);
        // Match the API's requirement for an explicit URL protocol while
        // allowing local hosts such as http://localhost:3000.
        return ["http:", "https:", "ftp:"].includes(parsed.protocol) && Boolean(parsed.hostname);
      } catch {
        return false;
      }
    }, "Enter a valid URL including its protocol."),
  type: z.enum(resourceTypes),
});

export type ProjectResourceFormValues = z.infer<typeof projectResourceSchema>;

import { useForm } from "react-hook-form";
import type { TechnicalEntry } from "../types/technical-entry";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTechnicalEntrySchema,
  type CreateTechnicalEntryFormValues,
  updateTechnicalEntrySchema,
  type UpdateTechnicalEntryFormValues,
} from "../schemas/technical-entry.schema";

export function useTechnicalEntryForm() {
  return useForm<CreateTechnicalEntryFormValues>({
    resolver: zodResolver(createTechnicalEntrySchema),
    defaultValues: {
      title: "",
      context: "",
      conclusion: "",
      type: "ISSUE",
    },
  });
}

export function useTechnicalEntryEditForm(entry: TechnicalEntry) {
  return useForm<UpdateTechnicalEntryFormValues>({
    resolver: zodResolver(updateTechnicalEntrySchema),
    defaultValues: {
      title: entry.title,
      context: entry.context,
      conclusion: entry.conclusion ?? "",
      projectId: entry.projectId ?? "",
    },
  });
}

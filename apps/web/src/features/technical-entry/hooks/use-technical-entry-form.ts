import { useForm } from "react-hook-form";
import type { TechnicalEntry } from "../types/technical-entry";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTechnicalEntrySchema,
  type CreateTechnicalEntryFormValues,
  type UpdateTechnicalEntryTitleFormValues,
  updateTechnicalEntryTitleSchema,
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

export function useTechnicalEntryTitleForm(entry: TechnicalEntry) {
  return useForm<UpdateTechnicalEntryTitleFormValues>({
    resolver: zodResolver(updateTechnicalEntryTitleSchema),
    defaultValues: {
      title: entry.title,
    },
  });
}

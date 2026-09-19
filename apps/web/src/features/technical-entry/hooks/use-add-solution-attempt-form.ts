import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  addSolutionAttemptSchema,
  type AddSolutionAttemptFormInput,
  type AddSolutionAttemptFormOutput,
} from "../schemas/solution-attempt.schema";

export function useAddSolutionAttemptForm() {
  // The form starts with raw strings; the resolver returns the parsed output
  // type after Zod validates the selected result.
  return useForm<
    AddSolutionAttemptFormInput,
    unknown,
    AddSolutionAttemptFormOutput
  >({
    resolver: zodResolver(addSolutionAttemptSchema),
    defaultValues: {
      description: "",
      result: "",
    },
  });
}

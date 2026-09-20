import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  projectCommandSchema,
  type ProjectCommandFormValues,
} from "../schemas/project-command.schema";
import type { ProjectCommand } from "../types/project-detail";

export function useProjectCommandForm(command?: ProjectCommand) {
  return useForm<ProjectCommandFormValues>({
    resolver: zodResolver(projectCommandSchema),
    defaultValues: {
      title: command?.title ?? "",
      command: command?.command ?? "",
      description: command?.description ?? "",
      executionOrder: command?.executionOrder?.toString() ?? "",
    },
  });
}

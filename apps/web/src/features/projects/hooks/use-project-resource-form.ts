import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  projectResourceSchema,
  type ProjectResourceFormValues,
} from "../schemas/project-resource.schema";
import type { ProjectResource } from "../types/project-detail";

export function useProjectResourceForm(resource?: ProjectResource) {
  return useForm<ProjectResourceFormValues>({
    resolver: zodResolver(projectResourceSchema),
    defaultValues: {
      label: resource?.label ?? "",
      url: resource?.url ?? "",
      type: resource?.type ?? "OTHER",
    },
  });
}

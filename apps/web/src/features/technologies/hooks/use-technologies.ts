import { useQuery } from "@tanstack/react-query";
import { listTechnologies, technologiesKeys } from "../api/technology-api";
import type { ListTechnologiesParams } from "../types/technology";

export function useTechnologies(params: ListTechnologiesParams) {
  return useQuery({
    queryKey: technologiesKeys.list(params),
    queryFn: () => listTechnologies(params),
  });
}

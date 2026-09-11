import { useQuery } from "@tanstack/react-query";
import {
  listTechnicalEntries,
  technicalEntriesKeys,
} from "../api/list-technical-entries";
import type { ListTechnicalEntriesParams } from "../types/technical-entry";

export function useTechnicalEntries(params: ListTechnicalEntriesParams) {
  return useQuery({
    queryKey: technicalEntriesKeys.list(params),
    queryFn: () => listTechnicalEntries(params),
  });
}

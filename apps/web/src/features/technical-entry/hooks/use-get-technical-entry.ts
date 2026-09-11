import { useQuery } from "@tanstack/react-query";
import {
  getTechnicalEntry,
  getTechnicalEntryQueryKey,
} from "../api/get-technical-entry";

export function useGetTechnicalEntry(technicalEntryId: string) {
  return useQuery({
    queryKey: getTechnicalEntryQueryKey(technicalEntryId),
    queryFn: () => getTechnicalEntry(technicalEntryId),
    // Route parameters can be temporarily empty while the page is resolving.
    enabled: Boolean(technicalEntryId),
    retry: false,
  });
}

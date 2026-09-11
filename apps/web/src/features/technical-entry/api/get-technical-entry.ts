import { api } from "@/api/http";
import type { TechnicalEntry } from "../types/technical-entry";

export const getTechnicalEntryQueryKey = (technicalEntryId: string) => [
  "technical-entry",
  technicalEntryId,
];

export async function getTechnicalEntry(
  technicalEntryId: string,
): Promise<TechnicalEntry> {
  const { data } = await api.get<TechnicalEntry>(
    `/technical-entry/${technicalEntryId}`,
  );

  return data;
}

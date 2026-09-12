import { api } from "@/api/http";
import type { TechnicalEntry } from "../types/technical-entry";

export async function archiveTechnicalEntry(
  technicalEntryId: string,
): Promise<TechnicalEntry> {
  const { data } = await api.patch<TechnicalEntry>(
    `/technical-entry/${technicalEntryId}/archive`,
  );

  return data;
}

export async function restoreTechnicalEntry(
  technicalEntryId: string,
): Promise<TechnicalEntry> {
  const { data } = await api.patch<TechnicalEntry>(
    `/technical-entry/${technicalEntryId}/restore`,
  );

  return data;
}

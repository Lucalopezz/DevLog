import { api } from "@/api/http";
import type {
  TechnicalEntry,
  UpdateTechnicalEntryInput,
} from "../types/technical-entry";

export async function updateTechnicalEntry(
  technicalEntryId: string,
  input: UpdateTechnicalEntryInput,
): Promise<TechnicalEntry> {
  const { data } = await api.patch<TechnicalEntry>(
    `/technical-entry/${technicalEntryId}`,
    input,
  );

  return data;
}

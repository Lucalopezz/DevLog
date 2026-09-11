import { api } from "@/api/http";
import type {
  CreateTechnicalEntryInput,
  TechnicalEntry,
} from "../types/technical-entry";

export async function createTechnicalEntry(
  input: CreateTechnicalEntryInput,
): Promise<TechnicalEntry> {
  const { data } = await api.post<TechnicalEntry>("/technical-entry", input);
  return data;
}

import { api } from "@/api/http";
import type {
  ListTechnicalEntriesParams,
  TechnicalEntryCollection,
} from "../types/technical-entry";

export async function listTechnicalEntries(
  params: ListTechnicalEntriesParams,
): Promise<TechnicalEntryCollection> {
  const { data } = await api.get<TechnicalEntryCollection>("/technical-entry", {
    params,
  });
  return data;
}

/**
 * Creates keys.
 * The first represents page 1. The second represents page 2.
 * React Query therefore caches each result separately.
 *
 * */

export const technicalEntriesKeys = {
  all: ["technical-entries"] as const,
  lists: () => [...technicalEntriesKeys.all, "lists"] as const,
  list: (params: ListTechnicalEntriesParams) =>
    [...technicalEntriesKeys.lists(), "list", params] as const,
};

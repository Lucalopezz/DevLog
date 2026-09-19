import { api } from "@/api/http";
import type {
  ResolveTechnicalIssueInput,
  TechnicalEntry,
} from "../types/technical-entry";

export async function resolveTechnicalIssue(
  technicalEntryId: string,
  input: ResolveTechnicalIssueInput,
): Promise<TechnicalEntry> {
  const { data } = await api.patch<TechnicalEntry>(
    `/technical-entry/${technicalEntryId}/resolve`,
    input,
  );

  return data;
}

export async function reopenTechnicalIssue(
  technicalEntryId: string,
): Promise<TechnicalEntry> {
  const { data } = await api.patch<TechnicalEntry>(
    `/technical-entry/${technicalEntryId}/reopen`,
  );

  return data;
}

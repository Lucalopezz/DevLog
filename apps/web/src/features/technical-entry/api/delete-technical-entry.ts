import { api } from "@/api/http";

export async function deleteTechnicalEntry(
  technicalEntryId: string,
): Promise<void> {
  await api.delete(`/technical-entry/${technicalEntryId}`);
}

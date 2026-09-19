import { api } from "@/api/http";

export async function deleteSolutionAttempt(
  technicalEntryId: string,
  attemptId: string,
): Promise<void> {
  await api.delete(
    `/technical-entry/${technicalEntryId}/solution-attempts/${attemptId}`,
  );
}

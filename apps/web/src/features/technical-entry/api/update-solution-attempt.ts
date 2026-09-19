import { api } from "@/api/http";
import type {
  SolutionAttempt,
  UpdateSolutionAttemptInput,
} from "../types/solution-attempt";

export async function updateSolutionAttempt(
  technicalEntryId: string,
  attemptId: string,
  input: UpdateSolutionAttemptInput,
): Promise<SolutionAttempt> {
  const { data } = await api.patch<SolutionAttempt>(
    `/technical-entry/${technicalEntryId}/solution-attempts/${attemptId}`,
    input,
  );
  return data;
}

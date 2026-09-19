import { api } from "@/api/http";
import type {
  AddSolutionAttemptInput,
  SolutionAttempt,
} from "../types/solution-attempt";

export async function addSolutionAttempt(
  technicalEntryId: string,
  input: AddSolutionAttemptInput,
): Promise<SolutionAttempt> {
  const { data } = await api.post<SolutionAttempt>(
    `/technical-entry/${technicalEntryId}/solution-attempts`,
    input,
  );
  return data;
}

import { api } from "@/api/http";
import type {
  ListSolutionAttemptsParams,
  SolutionAttemptCollection,
} from "../types/solution-attempt";

export async function listSolutionAttempts(
  technicalEntryId: string,
  params: ListSolutionAttemptsParams = {},
): Promise<SolutionAttemptCollection> {
  const { data } = await api.get<SolutionAttemptCollection>(
    `/technical-entry/${technicalEntryId}/solution-attempts`,
    { params },
  );

  return data;
}

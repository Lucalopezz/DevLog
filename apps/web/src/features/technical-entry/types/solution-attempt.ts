import type { Pagination } from "@/api/types";

export type SolutionAttemptResult = "FAILED" | "PARTIAL" | "SUCCESSFUL";

export type SolutionAttempt = {
  id: string;
  technicalEntryId: string;
  description: string;
  result: SolutionAttemptResult;
  createdAt: string;
  updatedAt: string;
};

export type SolutionAttemptCollection = Pagination<SolutionAttempt>;

export type ListSolutionAttemptsParams = {
  page?: number;
  perPage?: number;
  sort?: "createdAt" | "result";
  sortDir?: "asc" | "desc";
  result?: SolutionAttemptResult;
};

export type AddSolutionAttemptInput = {
  description: string;
  result: SolutionAttemptResult;
};

export type UpdateSolutionAttemptInput = {
  description: string;
};

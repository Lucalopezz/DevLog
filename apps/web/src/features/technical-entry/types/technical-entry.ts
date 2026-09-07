import type { Pagination } from "@/api/types";

export type TechnicalEntryType = "ISSUE" | "LEARNING";
export type TechnicalEntryStatus = "OPEN" | "RESOLVED";

export type TechnicalEntryTag = {
  id: string;
  name: string;
};

export type TechnicalEntry = {
  id: string;
  projectId?: string;
  title: string;
  context: string;
  conclusion?: string;
  type: TechnicalEntryType;
  status?: TechnicalEntryStatus;
  resolvedAt?: string;
  archivedAt?: string;
  tags?: TechnicalEntryTag[];
  createdAt: string;
  updatedAt: string;
};

export type TechnicalEntryCollection = Pagination<TechnicalEntry>;

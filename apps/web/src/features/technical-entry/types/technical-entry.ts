import type { Pagination } from "@/api/types";

export type TechnicalEntryType = "ISSUE" | "LEARNING";
export type TechnicalEntryStatus = "OPEN" | "RESOLVED";

/**
 * Query parameters accepted by GET /technical-entry.
 *
 * `archivedAt` is represented as a string because it is serialized into the
 * query string. The API also accepts the special value "null" for entries
 * that have not been archived.
 */
export type ListTechnicalEntriesParams = {
  page?: number;
  perPage?: number;
  sort?:
    | "createdAt"
    | "updatedAt"
    | "title"
    | "type"
    | "resolvedAt"
    | "archivedAt";
  sortDir?: "asc" | "desc";
  archivedAt?: string;
  type?: TechnicalEntryType;
  status?: TechnicalEntryStatus;
  projectId?: string;
  title?: string;
};

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

export type CreateTechnicalEntryInput = {
  title: string;
  projectId?: string | null;
  context: string;
  type: TechnicalEntryType;
  conclusion?: string;
};

/** Values kept by the create form before optional empty fields are normalized. */
export type CreateTechnicalEntryFormValues = {
  title: string;
  projectId: string;
  context: string;
  type: TechnicalEntryType;
  conclusion: string;
};

/**
 * Direct fields accepted by PATCH /technical-entry/:id.
 *
 * The partial shape preserves the distinction between an omitted field and a
 * `null` value, which clears nullable fields such as `projectId` and
 * `conclusion`.
 */
export type UpdateTechnicalEntryInput = {
  title?: string;
  context?: string;
  conclusion?: string | null;
  projectId?: string | null;
};

export type UpdateTechnicalEntryFormValues = {
  title: string;
  context: string;
  conclusion: string;
  projectId: string;
};

export type ResolveTechnicalIssueInput = {
  conclusion: string;
};

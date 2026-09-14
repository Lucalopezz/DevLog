import type { Pagination } from "@/api/types";

export type Tag = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ListTagsParams = {
  page?: number;
  perPage?: number;
  sort?: "name" | "createdAt" | "updatedAt";
  sortDir?: "asc" | "desc";
  name?: string;
};

export type TagCollection = Pagination<Tag>;

export type CreateTagInput = {
  name: string;
};

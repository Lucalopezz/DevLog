/**
 * Metadata shared by paginated API responses.
 *
 * This type stays near the HTTP infrastructure because it is not tied to a specific
 * domain: Projects, Tags, and Technical Entries can reuse it.
 */
export type Meta = {
  currentPage: number;
  perPage: number;
  lastPage: number;
  total: number;
};

export type Pagination<T> = {
  data: T[];
  meta: Meta;
};

import { SortDirection } from '@/shared/domain/repositories/searchable.repository';

export type SearchInput<Filter = string> = {
  page?: number;
  perPage?: number;
  sort?: string;
  sortDir?: SortDirection;
  filter?: Filter | null;
};

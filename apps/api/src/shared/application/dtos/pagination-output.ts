import { Entity } from '@/shared/domain/entities/entity';
import { SearchResult } from '@/shared/domain/repositories/searchable.repository';

export type PaginationOutput<Item = unknown> = {
  items: Item[];
  total: number;
  currentPage: number;
  lastPage: number;
  perPage: number;
};
export class PaginationOutputMapper {
  static toOutout<Item = any, Filter = string>(
    items: Item[],
    result: SearchResult<Entity, Filter>,
  ): PaginationOutput<Item> {
    return {
      items,
      total: result.total,
      currentPage: result.currentPage,
      lastPage: result.lastPage,
      perPage: result.perPage,
    };
  }
}

import { Entity } from '../entities/entity';
import { RepositoryInterface } from './repository-contract';

export type SortDirection = 'asc' | 'desc';

export type SearchProps<T = string> = {
  page?: number;
  perPage?: number;
  sort?: string | null;
  sortDir?: SortDirection | null;
  filter?: T | null;
};

export type SearchResultProps<E extends Entity, T> = {
  items: E[];
  total: number;
  currentPage: number;
  perPage: number;
  sort?: string | null;
  sortDir?: SortDirection | null;
  filter?: T | null;
};

export class SearchParams<T = string> {
  protected _page: number;
  protected _perPage: number = 15;
  protected _sort: string | null;
  protected _sortDir: SortDirection | null;
  protected _filter: T | null;

  constructor(props: SearchProps<T> = {}) {
    this.page = props.page ?? 1;
    this.perPage = props.perPage ?? 15;
    this.sort = props.sort ?? null;
    this.sortDir = props.sortDir ?? null;
    this.filter = props.filter ?? null;
  }

  get page(): number {
    return this._page;
  }

  private set page(value: number) {
    let _page = +value;
    if (Number.isNaN(_page) || _page <= 0) {
      _page = 1;
    }
    this._page = _page;
  }

  get perPage(): number {
    return this._perPage;
  }
  private set perPage(value: number) {
    // If the value is true, it means that the user wants to use the default value of perPage, which is 15.
    // If the value is a number, it will be used as the new value of perPage.
    let _perPage = value === (true as any) ? this._perPage : +value;
    // If the value is not a number or less than or equal to 0,
    // it will be ignored and the default value will be used.
    if (Number.isNaN(_perPage) || _perPage <= 0) {
      _perPage = this._perPage;
    }
    this._perPage = _perPage;
  }

  get sort(): string | null {
    return this._sort;
  }
  private set sort(value: string | null) {
    this._sort =
      value === null || value === undefined || value === '' ? null : `${value}`;
  }

  get sortDir(): SortDirection | null {
    return this._sortDir;
  }

  private set sortDir(value: SortDirection | null) {
    if (!this.sort) {
      this._sortDir = null;
      return;
    }
    const dir = value?.toLowerCase();
    this._sortDir = dir !== 'asc' && dir !== 'desc' ? 'asc' : dir;
  }

  get filter(): T | null {
    return this._filter;
  }
  private set filter(value: T | null) {
    if (
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value === '')
    ) {
      this._filter = null;
    } else if (typeof value !== 'object') {
      this._filter = String(value) as T;
    } else {
      this._filter = value;
    }
  }
}

// Offers a way to return a paginated list of items, with the total number of items,
// the current page, the number of items per page, the last page, the sort field, the sort direction and the filter.
export class SearchResult<E extends Entity, Filter = string> {
  readonly items: E[];
  readonly total: number;
  readonly currentPage: number;
  readonly perPage: number;
  readonly lastPage: number;
  readonly sort?: string | null;
  readonly sortDir?: string | null;
  readonly filter?: Filter | null;

  constructor(props: SearchResultProps<E, Filter>) {
    this.items = props.items;
    this.total = props.total;
    this.currentPage = props.currentPage;
    this.perPage = props.perPage;
    this.lastPage = Math.ceil(this.total / this.perPage);
    this.sort = props.sort ?? null;
    this.sortDir = props.sortDir ?? null;
    this.filter = props.filter ?? null;
  }
  // forceEntity: if true, the items will be converted to JSON using the toJSON method of the entity,
  // otherwise, the items will be returned as is.
  toJSON(forceEntity = false) {
    return {
      items: forceEntity ? this.items.map((item) => item.toJSON()) : this.items,
      total: this.total,
      currentPage: this.currentPage,
      perPage: this.perPage,
      lastPage: this.lastPage,
      sort: this.sort,
      sortDir: this.sortDir,
      filter: this.filter,
    };
  }
}

export interface SearchableRepositoryInterface<
  E extends Entity,
  Filter = string,
  SearchInput = SearchParams<Filter>,
  SearchOutput = SearchResult<E, Filter>,
> extends RepositoryInterface<E> {
  sortableFields: string[];
  search(props: SearchInput): Promise<SearchOutput>;
}

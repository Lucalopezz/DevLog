import { Exclude, Expose } from 'class-transformer';
import {
  PaginationPresenter,
  type PaginationPresenterProps,
} from './pagination.presenter';

export abstract class CollectionPresenter<TData = unknown> {
  // Keep the internal property out of the response. The getter below exposes
  // the same value publicly under the API's `meta` key.
  @Exclude()
  protected paginationPresenter: PaginationPresenter;

  constructor(paginationPresenter: PaginationPresenterProps) {
    // Build a presenter instance so class-transformer can recognize its
    // decorators and metadata when the collection is serialized. `new` alone
    // does not run @Transform; that happens during class-transformer execution.
    this.paginationPresenter = new PaginationPresenter(paginationPresenter);
  }

  @Expose({ name: 'meta' })
  get meta(): PaginationPresenter {
    return this.paginationPresenter;
  }

  abstract get data(): TData[];
}

import { Transform, type TransformFnParams } from 'class-transformer';

export type PaginationPresenterProps = {
  currentPage: number;
  perPage: number;
  lastPage: number;
  total: number;
};

export class PaginationPresenter {
  @Transform(({ value }: TransformFnParams) =>
    Number.parseInt(String(value), 10),
  )
  currentPage: number;

  @Transform(({ value }: TransformFnParams) =>
    Number.parseInt(String(value), 10),
  )
  perPage: number;

  @Transform(({ value }: TransformFnParams) =>
    Number.parseInt(String(value), 10),
  )
  lastPage: number;

  @Transform(({ value }: TransformFnParams) =>
    Number.parseInt(String(value), 10),
  )
  total: number;

  constructor(props: PaginationPresenterProps) {
    this.currentPage = props.currentPage;
    this.perPage = props.perPage;
    this.lastPage = props.lastPage;
    this.total = props.total;
  }
}

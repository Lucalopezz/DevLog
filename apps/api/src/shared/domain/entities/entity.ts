import { v4 as uuid } from 'uuid';

export abstract class Entity<T = any> {
  public readonly _id: string;
  public readonly props: T;

  constructor(props: T, id?: string) {
    this._id = id ?? uuid();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  toJSON(): Required<{ id: string } & T> {
    return {
      id: this.id,
      ...this.props,
    } as Required<{ id: string } & T>;
  }
}

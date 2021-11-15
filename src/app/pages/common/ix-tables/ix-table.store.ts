import { ComponentStore } from '@ngrx/component-store';

export interface IxTableState<T = any> {
  loading: boolean;
  error: boolean;
  data: T;
  pageIndex: number;
  pageSize: number;
  sortDirection: 'asc' | 'desc';
  sortField?: string;
}

const initialState: IxTableState = {
  loading: false,
  error: false,
  data: [],
  pageIndex: 1,
  pageSize: 50,
  sortDirection: 'asc',
};

export class IxTableStore extends ComponentStore<IxTableState> {
  constructor() {
    super(initialState);
  }
}

export enum BulkListItemState {
  Initial = 'INITIAL',
  Running = 'RUNNING',
  Success = 'SUCCESS',
  Error = 'ERROR',
}
export interface BulkListItem<T> {
  state: BulkListItemState;
  item: T;
  message?: string;
}

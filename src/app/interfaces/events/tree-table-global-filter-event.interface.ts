export interface TreeTableGlobalFilterEvent {
  name: 'TreeTableGlobalFilter';
  sender: unknown;
  data: { column: string; value: string };
}

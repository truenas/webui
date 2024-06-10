export interface TableFilter<T> {
  query: string;
  columnKeys: (keyof T)[];
  list?: T[];
  preprocessMap?: Partial<Record<keyof T, (value: T[keyof T]) => string>>;
}

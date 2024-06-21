export interface TableFilter<T> {
  query: string;
  columnKeys: (keyof T)[];
  list?: T[];
  preprocessMap?: {
    [K in keyof T]?: (value: T[K]) => string;
  };
}

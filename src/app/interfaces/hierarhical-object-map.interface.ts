export interface HierarchicalObjectMap<T> {
  [key: string]: T | HierarchicalObjectMap<T> | undefined;
}

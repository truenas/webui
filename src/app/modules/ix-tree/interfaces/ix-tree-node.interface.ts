export interface IxTreeNode<T> {
  label: string;
  children?: IxTreeNode<T>[];
  item: T;
  icon: string;
}

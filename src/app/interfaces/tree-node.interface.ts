import { TreeNode as OriginalTreeNode } from 'angular-tree-component';

/**
 * This is basically a TreeNode from 'angular-tree-component'
 * with additional typing provided for data.
 */
export interface TreeNode<T> extends OriginalTreeNode {
  data: T;
}

/**
 * @see ListdirChild
 * for older variant
 */
export interface ExplorerNodeData {
  path: string;
  name: string;

  /**
   * There is both hasChildren on TreeNodeData (supplied by us) and on TreeNode (from angular-tree-component)
   */
  hasChildren: boolean;

  children?: ExplorerNodeData[];
  isExpanded?: boolean;
}

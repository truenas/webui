import { TreeNode as OriginalTreeNode } from '@bugsplat/angular-tree-component';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';

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
  type: ExplorerNodeType;

  /**
   * There is both hasChildren on TreeNodeData (supplied by us) and on TreeNode (from angular-tree-component)
   */
  hasChildren: boolean;

  children?: ExplorerNodeData[];
  isExpanded?: boolean;
  isMountpoint?: boolean;
  isLock?: boolean;
}

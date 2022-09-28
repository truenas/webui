/**
 * Older variant of data inside of a TreeNode
 * @deprecated
 * @see ExplorerNodeData
 * for newer variant
 */
export interface ListdirChild {
  name: string;
  acl?: boolean;
  hasChildren?: boolean;
  subTitle: string;
  children?: ListdirChild[];
  expanded?: boolean;
}

import { Observable } from 'rxjs';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';

export type TreeNodeProvider = (parent: TreeNode<ExplorerNodeData>) => Observable<ExplorerNodeData[]>;

import { Dataset } from 'app/interfaces/dataset.interface';
import { IxTreeNode } from 'app/modules/ix-tree/interfaces/ix-tree-node.interface';

export interface DatasetNode extends IxTreeNode<Dataset> {
  roles: string[];
  parent?: DatasetNode;
}

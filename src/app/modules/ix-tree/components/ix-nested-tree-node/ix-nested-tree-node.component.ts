import { CdkNestedTreeNode, CdkTreeNode, CDK_TREE_NODE_OUTLET_NODE } from '@angular/cdk/tree';
import { Component, Input } from '@angular/core';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-nested-tree-datasource';

@Component({
  selector: 'ix-nested-tree-node',
  templateUrl: './ix-nested-tree-node.component.html',
  styleUrls: ['./ix-nested-tree-node.component.scss'],
  exportAs: 'ixNestedTreeNode',
  providers: [
    { provide: CdkNestedTreeNode, useExisting: IxNestedTreeNodeComponent },
    { provide: CdkTreeNode, useExisting: IxNestedTreeNodeComponent },
    { provide: CDK_TREE_NODE_OUTLET_NODE, useExisting: IxNestedTreeNodeComponent },
  ],
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['role', 'disabled', 'tabIndex'],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    class: 'ix-nested-tree-node',
  },
})
export class IxNestedTreeNodeComponent<T, K = T> extends CdkNestedTreeNode<T, K> {
  @Input() ixTreeNodeDefDataSource: IxNestedTreeDataSource<T>;
}

import { CdkNestedTreeNode, CdkTreeNode, CDK_TREE_NODE_OUTLET_NODE } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, Component, HostBinding, input,
} from '@angular/core';
import { NestedTreeDataSource } from 'app/modules/ix-tree/nested-tree-datasource';

@Component({
  selector: 'ix-nested-tree-node',
  template: '<ng-content></ng-content>',
  styleUrls: ['./nested-tree-node.component.scss'],
  exportAs: 'ixNestedTreeNode',
  providers: [
    { provide: CdkNestedTreeNode, useExisting: NestedTreeNodeComponent },
    { provide: CdkTreeNode, useExisting: NestedTreeNodeComponent },
    { provide: CDK_TREE_NODE_OUTLET_NODE, useExisting: NestedTreeNodeComponent },
  ],
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['role', 'disabled', 'tabIndex'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class NestedTreeNodeComponent<T, K = T> extends CdkNestedTreeNode<T, K> {
  @HostBinding('class.ix-nested-tree-node') get hostClass(): boolean { return true; }

  readonly treeNodeDefDataSource = input<NestedTreeDataSource<T>>();
}

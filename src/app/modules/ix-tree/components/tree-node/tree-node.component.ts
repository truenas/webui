import { DataSource } from '@angular/cdk/collections';
import { CdkTreeNode } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, Component, HostBinding, Input,
} from '@angular/core';
import { TreeDataSource } from 'app/modules/ix-tree/tree-datasource';

@Component({
  selector: 'ix-tree-node',
  template: '<ng-content></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./tree-node.component.scss'],
  exportAs: 'ixTreeNode',
  providers: [{ provide: CdkTreeNode, useExisting: TreeNodeComponent }],
  standalone: true,
})
export class TreeNodeComponent<T, K = T> extends CdkTreeNode<T, K> {
  @HostBinding('class.ix-tree-node') get getClass(): boolean { return true; }
  @Input() treeNodeDefDataSource: DataSource<T> | TreeDataSource<T, K>;
}

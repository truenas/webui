import { CdkTree } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, Component, HostBinding, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { Tree } from 'app/modules/ix-tree/components/tree/tree.component';
import { TreeNodeOutletDirective } from 'app/modules/ix-tree/directives/tree-node-outlet.directive';

@Component({
  selector: 'ix-tree-view',
  exportAs: 'ixTreeView',
  template: '<ng-container treeNodeOutlet></ng-container>',
  styleUrls: ['./tree-view.component.scss'],
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: CdkTree, useExisting: TreeViewComponent },
    { provide: Tree, useExisting: TreeViewComponent },
  ],
  standalone: true,
  imports: [TreeNodeOutletDirective],
})
export class TreeViewComponent<T> extends Tree<T> {
  @HostBinding('class.ix-tree') get ixTreeClass(): boolean { return true; }
  @ViewChild(TreeNodeOutletDirective, { static: true }) nodeOutlet!: TreeNodeOutletDirective<T>;
}

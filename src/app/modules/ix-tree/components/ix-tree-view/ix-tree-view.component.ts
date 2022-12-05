import { CdkTree } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, Component, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { IxTree } from 'app/modules/ix-tree/components/ix-tree/ix-tree.component';
import { IxTreeNodeOutletDirective } from 'app/modules/ix-tree/directives/ix-tree-node-outlet.directive';

@Component({
  selector: 'ix-tree-view',
  exportAs: 'ixTreeView',
  template: '<ng-container ixTreeNodeOutlet></ng-container>',
  styleUrls: ['./ix-tree-view.component.scss'],
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: CdkTree, useExisting: IxTreeViewComponent },
    { provide: IxTree, useExisting: IxTreeViewComponent },
  ],
})
export class IxTreeViewComponent<T> extends IxTree<T> {
  @ViewChild(IxTreeNodeOutletDirective, { static: true }) nodeOutlet!: IxTreeNodeOutletDirective<T>;
}

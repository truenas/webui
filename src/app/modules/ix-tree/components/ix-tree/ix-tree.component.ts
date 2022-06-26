import { CdkTree } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, Component, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { IxTreeNodeOutletDirective } from 'app/modules/ix-tree/directives/ix-tree-node-outlet.directive';

@Component({
  selector: 'ix-tree',
  exportAs: 'ixTree',
  template: '<ng-container ixTreeNodeOutlet></ng-container>',
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    class: 'ix-tree',
    role: 'tree',
  },
  styleUrls: ['./ix-tree.component.scss'],
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
  // See note on CdkTree for explanation on why this uses the default change detection strategy.
  changeDetection: ChangeDetectionStrategy.Default,
  providers: [{ provide: CdkTree, useExisting: IxTreeComponent }],
})
export class IxTreeComponent<T, K = T> extends CdkTree<T, K> {
  // Outlets within the tree's template where the dataNodes will be inserted.
  @ViewChild(IxTreeNodeOutletDirective, { static: true }) override _nodeOutlet: IxTreeNodeOutletDirective<T>;
}

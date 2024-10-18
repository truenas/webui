import { CdkTreeNodeOutlet, CDK_TREE_NODE_OUTLET_NODE } from '@angular/cdk/tree';
import {
  Directive, Inject, Optional, ViewContainerRef,
} from '@angular/core';

/**
 * Outlet for nested CdkNode. Put `[treeNodeOutlet]` on a tag to place children dataNodes
 * inside the outlet.
 */
@Directive({
  selector: '[treeNodeOutlet]',
  providers: [{ provide: CdkTreeNodeOutlet, useExisting: TreeNodeOutletDirective }],
  standalone: true,
})
export class TreeNodeOutletDirective<T> implements CdkTreeNodeOutlet {
  constructor(
    public viewContainer: ViewContainerRef,
    @Inject(CDK_TREE_NODE_OUTLET_NODE) @Optional() public _node?: T,
  ) {}
}

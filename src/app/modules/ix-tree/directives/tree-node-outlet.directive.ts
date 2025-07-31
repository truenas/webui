import { CdkTreeNodeOutlet, CDK_TREE_NODE_OUTLET_NODE } from '@angular/cdk/tree';
import { Directive, ViewContainerRef, inject } from '@angular/core';

/**
 * Outlet for nested CdkNode. Put `[treeNodeOutlet]` on a tag to place children dataNodes
 * inside the outlet.
 */
@Directive({
  selector: '[treeNodeOutlet]',
  providers: [{ provide: CdkTreeNodeOutlet, useExisting: TreeNodeOutletDirective }],
})
export class TreeNodeOutletDirective<T> implements CdkTreeNodeOutlet {
  viewContainer = inject(ViewContainerRef);
  _node? = inject<T>(CDK_TREE_NODE_OUTLET_NODE, { optional: true });
}

import { CdkTree, CdkTreeNode, CdkTreeNodeToggle } from '@angular/cdk/tree';
import { Directive } from '@angular/core';

@Directive({
  selector: '[ixTreeNodeToggle]',
  providers: [{ provide: CdkTreeNodeToggle, useExisting: IxTreeNodeToggleDirective }],
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['recursive: ixTreeNodeToggleRecursive'],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    class: 'ix-tree-node-toggle',
  },
})
export class IxTreeNodeToggleDirective<T, K = T> extends CdkTreeNodeToggle<T, K> {
  constructor(protected _tree: CdkTree<T, K>, protected _treeNode: CdkTreeNode<T, K>) {
    super(_tree, _treeNode);
  }

  /**
   * Toggle tree node state on click.
   * Supports recursive expanding/collapsing on alt+click
   * @param event
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  override _toggle(event: PointerEvent): void {
    if (this.recursive || event.altKey) {
      this._tree.treeControl.toggleDescendants(this._treeNode.data);
    } else {
      this._tree.treeControl.toggle(this._treeNode.data);
    }

    event.stopPropagation();
  }
}

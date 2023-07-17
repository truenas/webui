import { CdkTreeNode, CdkTreeNodeToggle } from '@angular/cdk/tree';
import { Directive, HostBinding } from '@angular/core';
import { Tree } from 'app/modules/ix-tree/components/tree/tree.component';

@Directive({
  selector: '[treeNodeToggle]',
  providers: [{ provide: CdkTreeNodeToggle, useExisting: TreeNodeToggleDirective }],
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['recursive: treeNodeToggleRecursive'],
})
export class TreeNodeToggleDirective<T> extends CdkTreeNodeToggle<T> {
  @HostBinding('class.ix-tree-node-toggle') get hostClass(): boolean { return true; }

  constructor(
    protected _tree: Tree<T>,
    protected _treeNode: CdkTreeNode<T>,
  ) {
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

  get isExpanded(): boolean {
    return this._treeNode.isExpanded;
  }

  get level(): number {
    return this._treeNode.level;
  }
}

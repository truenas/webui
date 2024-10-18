import { CdkTreeNode, CdkTreeNodeToggle } from '@angular/cdk/tree';
import { Directive, HostBinding } from '@angular/core';
import { Tree } from 'app/modules/ix-tree/components/tree/tree.component';

@Directive({
  selector: '[treeNodeToggle]',
  providers: [{ provide: CdkTreeNodeToggle, useExisting: TreeNodeToggleDirective }],
  host: {
    '(click)': 'toggleWithAlt($event); $event.stopPropagation();',
    '(keydown.Enter)': 'toggleWithAlt($event); $event.preventDefault();',
    '(keydown.Space)': 'toggleWithAlt($event); $event.preventDefault();',
  },
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['recursive: treeNodeToggleRecursive'],
  standalone: true,
})
export class TreeNodeToggleDirective<T> extends CdkTreeNodeToggle<T> {
  @HostBinding('class.ix-tree-node-toggle') get hostClass(): boolean { return true; }

  constructor(
    protected override _tree: Tree<T>,
    protected override _treeNode: CdkTreeNode<T>,
  ) {
    super(_tree, _treeNode);
  }

  /**
   * This adds support for toggling all descendants when alt key is pressed.
   * Original `_toggle()` of the base class is also called.
   */
  toggleWithAlt(event: PointerEvent): void {
    if (event.altKey) {
      // Original `_toggle()` will open the tree, so we close it.
      this._tree.treeControl.toggle(this._treeNode.data);
      // And reopen again with descendants.
      this._tree.treeControl.toggleDescendants(this._treeNode.data);
    }
  }
}

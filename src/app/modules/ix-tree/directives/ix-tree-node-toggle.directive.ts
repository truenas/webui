import { CdkTreeNode, CdkTreeNodeToggle } from '@angular/cdk/tree';
import { Directive, ChangeDetectorRef } from '@angular/core';
import {
  animationFrameScheduler, asapScheduler, auditTime, merge,
} from 'rxjs';
import { IxTree } from 'app/modules/ix-tree/components/ix-tree/ix-tree.component';

const frameScheduler = typeof requestAnimationFrame !== 'undefined' ? animationFrameScheduler : asapScheduler;

@Directive({
  selector: '[ixTreeNodeToggle]',
  providers: [{ provide: CdkTreeNodeToggle, useExisting: IxTreeNodeToggleDirective }],
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['recursive: ixTreeNodeToggleRecursive'],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    class: 'ix-tree-node-toggle',
    '[class.isExpanded]': 'isExpanded',
    '[class.isCollapsed]': '!isExpanded',
  },
})
export class IxTreeNodeToggleDirective<T> extends CdkTreeNodeToggle<T> {
  constructor(
    protected _tree: IxTree<T>,
    protected _treeNode: CdkTreeNode<T>,
    protected cdr: ChangeDetectorRef,
  ) {
    super(_tree, _treeNode);

    merge(_treeNode._dataChanges, _tree._dataSourceChanged)
      .pipe(auditTime(0, frameScheduler))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
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
}

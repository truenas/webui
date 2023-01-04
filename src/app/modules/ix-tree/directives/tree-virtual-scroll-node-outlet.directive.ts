import { CdkTreeNode, CdkTreeNodeOutletContext } from '@angular/cdk/tree';
import {
  Directive, OnChanges, EmbeddedViewRef, Input, ViewContainerRef, SimpleChanges, SimpleChange,
} from '@angular/core';
import { IxTreeVirtualNodeData } from 'app/modules/ix-tree/interfaces/tree-virtual-node-data.interface';

@Directive({
  selector: '[ixTreeVirtualScrollNodeOutlet]',
})
export class IxTreeVirtualScrollNodeOutletDirective<T> implements OnChanges {
  private _viewRef: EmbeddedViewRef<unknown> | null = null;
  @Input() data!: IxTreeVirtualNodeData<T>;

  constructor(private _viewContainerRef: ViewContainerRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    const recreateView = this.shouldRecreateView(changes);
    if (recreateView) {
      const viewContainerRef = this._viewContainerRef;

      if (this._viewRef) {
        viewContainerRef.remove(viewContainerRef.indexOf(this._viewRef));
      }

      this._viewRef = this.data
        ? viewContainerRef.createEmbeddedView(this.data.nodeDef.template, this.data.context)
        : null;

      if (CdkTreeNode.mostRecentTreeNode && this._viewRef) {
        CdkTreeNode.mostRecentTreeNode.data = this.data.data;
      }
    } else if (this._viewRef && this.data.context) {
      this.updateExistingContext(this.data.context);
    }
  }

  private shouldRecreateView(changes: SimpleChanges): boolean {
    const ctxChange = changes.data;
    return ctxChange && this.hasContextShapeChanged(ctxChange);
  }

  private hasContextShapeChanged(ctxChange: SimpleChange): boolean {
    const prevCtxKeys = Object.keys(ctxChange.previousValue || {});
    const currCtxKeys = Object.keys(ctxChange.currentValue || {});

    if (prevCtxKeys.length === currCtxKeys.length) {
      for (const propName of currCtxKeys) {
        if (!prevCtxKeys.includes(propName)) {
          return true;
        }
      }
      return ctxChange.previousValue?.data !== ctxChange.currentValue?.data;
    }
    return true;
  }

  private updateExistingContext(ctx: CdkTreeNodeOutletContext<T>): void {
    for (const propName of Object.keys(ctx)) {
      // eslint-disable-next-line max-len
      (this._viewRef.context as Record<string, unknown>)[propName] = (this.data.context as unknown as Record<string, unknown>)[propName];
    }
  }
}

import { CdkTreeNode, CdkTreeNodeOutletContext } from '@angular/cdk/tree';
import {
  Directive, OnChanges, EmbeddedViewRef, ViewContainerRef, input,
} from '@angular/core';
import { IxSimpleChange, IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { TreeVirtualNodeData } from 'app/modules/ix-tree/interfaces/tree-virtual-node-data.interface';

@Directive({
  selector: '[ixTreeVirtualScrollNodeOutlet]',
  standalone: true,
})
export class TreeVirtualScrollNodeOutletDirective<T> implements OnChanges {
  private _viewRef: EmbeddedViewRef<unknown> | null = null;
  readonly data = input.required<TreeVirtualNodeData<T>>();

  constructor(private _viewContainerRef: ViewContainerRef) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    const recreateView = this.shouldRecreateView(changes);
    if (recreateView) {
      const viewContainerRef = this._viewContainerRef;

      if (this._viewRef) {
        viewContainerRef.remove(viewContainerRef.indexOf(this._viewRef));
      }

      this._viewRef = this.data()
        ? viewContainerRef.createEmbeddedView(this.data().nodeDef.template, this.data().context)
        : null;

      if (CdkTreeNode.mostRecentTreeNode && this._viewRef) {
        CdkTreeNode.mostRecentTreeNode.data = this.data().data;
      }
    } else if (this._viewRef && this.data().context) {
      this.updateExistingContext(this.data().context);
    }
  }

  private shouldRecreateView(changes: IxSimpleChanges<this>): boolean {
    const ctxChange = changes.data;
    return ctxChange && this.hasContextShapeChanged(ctxChange);
  }

  private hasContextShapeChanged(ctxChange: IxSimpleChange<this['data']>): boolean {
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
      // eslint-disable-next-line @stylistic/ts/max-len
      (this._viewRef.context as Record<string, unknown>)[propName] = (this.data().context as unknown as Record<string, unknown>)[propName];
    }
  }
}

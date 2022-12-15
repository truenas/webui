import { Directionality } from '@angular/cdk/bidi';
import {
  CdkDrag, CDK_DRAG_CONFIG, CDK_DRAG_PARENT, DragDrop, DragDropConfig,
} from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectorRef,
  ContentChildren,
  Directive,
  ElementRef,
  Inject,
  NgZone,
  Optional,
  QueryList,
  Self,
  SkipSelf,
  ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { take } from 'rxjs/operators';
import { IxDragHandleDirective } from 'app/modules/ix-drop-grid/ix-drag-handle.directive';
import { IxDropGridItemDirective } from 'app/modules/ix-drop-grid/ix-drop-grid-item.directive';
import {
  ixDragHandleDirectiveToken,
  ixDragParentToken,
  ixDropGridItemDirectiveToken,
} from 'app/modules/ix-drop-grid/ix-drop-grid.tokens';

@UntilDestroy()
@Directive({
  selector: '[ixDrag]',
  providers: [
    { provide: ixDragParentToken, useExisting: this },
    { provide: CDK_DRAG_PARENT, useExisting: this },
  ],
})
export class IxDragDirective extends CdkDrag {
  @ContentChildren(ixDragHandleDirectiveToken, { descendants: true }) _ixHandles: QueryList<IxDragHandleDirective>;

  constructor(
    private ngZone: NgZone,
    element: ElementRef<HTMLElement>,
    @Inject(DOCUMENT) document: Document,
    viewContainerRef: ViewContainerRef,
    @Optional() @Inject(CDK_DRAG_CONFIG) config: DragDropConfig,
    @Optional() dir: Directionality,
    dragDrop: DragDrop,
    changeDetectorRef: ChangeDetectorRef,
    @Optional() @Self() @Inject(ixDragHandleDirectiveToken) selfHandle?: IxDragHandleDirective,
    @Optional() @SkipSelf() @Inject(ixDragParentToken) parentDrag?: IxDragDirective,

    // Inject parent item
    @Inject(ixDropGridItemDirectiveToken) @Optional() @SkipSelf() parentItem?: IxDropGridItemDirective,
  ) {
    super(
      element,
      parentItem,
      document,
      ngZone,
      viewContainerRef,
      config,
      dir,
      dragDrop,
      changeDetectorRef,
      selfHandle,
      parentDrag,
    );

    this.injectIxHandles();
  }

  private injectIxHandles(): void {
    // We need to wait for the zone to stabilize, in order for the reference
    // element to be in the proper place in the DOM. This is mostly relevant
    // for draggable elements inside portals since they get stamped out in
    // their original DOM position and then they get transferred to the portal.
    this.ngZone.onStable.pipe(take(1), untilDestroyed(this)).subscribe(() => {
      this._handles = this._ixHandles;
    });
  }
}

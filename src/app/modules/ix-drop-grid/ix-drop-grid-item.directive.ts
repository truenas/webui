import { Directionality } from '@angular/cdk/bidi';
import {
  CdkDropList, CDK_DRAG_CONFIG, DragDrop, DragDropConfig,
} from '@angular/cdk/drag-drop';
import { ScrollDispatcher } from '@angular/cdk/overlay';
import {
  AfterViewInit, ChangeDetectorRef, Directive, ElementRef, Inject, Optional, SkipSelf,
} from '@angular/core';
import { IxDropGridDirective } from 'app/modules/ix-drop-grid/ix-drop-grid.directive';
import {
  ixDropGridDirectiveToken,
  ixDropGridItemDirectiveToken,
} from 'app/modules/ix-drop-grid/ix-drop-grid.tokens';

@Directive({
  selector: '[ixDropGridItem]',
  providers: [
    // Prevent child items from picking up the same grid as their parent.
    { provide: ixDropGridDirectiveToken, useValue: undefined },
    { provide: ixDropGridItemDirectiveToken, useExisting: IxDropGridItemDirective },
  ],
  standalone: true,
})
export class IxDropGridItemDirective<T = unknown> extends CdkDropList<T> implements AfterViewInit {
  constructor(
    element: ElementRef<HTMLElement>,
    dragDrop: DragDrop,
    changeDetectorRef: ChangeDetectorRef,
    scrollDispatcher: ScrollDispatcher,
    @Optional() dir?: Directionality,
    @Optional() @Inject(CDK_DRAG_CONFIG) config?: DragDropConfig,

    // Inject parent grid
    @Optional()
    @Inject(ixDropGridDirectiveToken)
    @SkipSelf()
    private parentGrid?: IxDropGridDirective,
  ) {
    super(
      element,
      dragDrop,
      changeDetectorRef,
      scrollDispatcher,
      dir,
      parentGrid,
      config,
    );
  }

  ngAfterViewInit(): void {
    if (!this.parentGrid) {
      return;
    }
    this.parentGrid.registerItem(this);
  }
}

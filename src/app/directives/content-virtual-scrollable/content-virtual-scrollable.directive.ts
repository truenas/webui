import { CdkVirtualScrollable, VIRTUAL_SCROLLABLE } from '@angular/cdk/scrolling';
import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject } from '@angular/core';

/**
 * Lets a descendant `cdk-virtual-scroll-viewport` virtualize against the main scroll container
 * (`.rightside-content-hold`), so the list scrolls with the page; it doesn't scroll its own host.
 * CDK's `CdkVirtualScrollableElement` would stamp `overflow: auto; contain: strict` on the host, so
 * this re-points `CdkScrollable` at the container, as `CdkVirtualScrollableWindow` does for the document.
 */
@Directive({
  selector: '[ixContentVirtualScrollable]',
  providers: [{ provide: VIRTUAL_SCROLLABLE, useExisting: ContentVirtualScrollableDirective }],
})
export class ContentVirtualScrollableDirective extends CdkVirtualScrollable {
  constructor() {
    super();
    const scrollElement = inject(DOCUMENT).querySelector<HTMLElement>('.rightside-content-hold');
    if (scrollElement) {
      this.elementRef = new ElementRef(scrollElement);
      this._scrollElement = scrollElement;
    }
  }

  measureBoundingClientRectWithScrollOffset(from: 'left' | 'top' | 'right' | 'bottom'): number {
    return this.getElementRef().nativeElement.getBoundingClientRect()[from] - this.measureScrollOffset(from);
  }
}

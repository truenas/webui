import { CdkVirtualScrollable, VIRTUAL_SCROLLABLE } from '@angular/cdk/scrolling';
import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject } from '@angular/core';

/**
 * Lets a descendant `cdk-virtual-scroll-viewport` virtualize against the app's main scroll
 * container (`.rightside-content-hold`) instead of owning its own scrollbar — so a
 * virtualized list scrolls together with the page. Apply it on any element that is an
 * ancestor of the viewport (in the injector tree); it does NOT scroll or contain its own
 * host element.
 *
 * Why not CDK's own `CdkVirtualScrollableElement`? That directive scrolls its own host
 * element and stamps `cdk-virtual-scrollable` (`overflow: auto; contain: strict`) onto it,
 * which would break the host's layout here. This variant instead re-points
 * `CdkScrollable`'s element/target at `.rightside-content-hold` — the same technique
 * `CdkVirtualScrollableWindow` uses to target the document element — and provides
 * `VIRTUAL_SCROLLABLE` so the viewport picks it up (it injects the token `{ optional: true }`
 * and falls back to self-scrolling when no provider is found).
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

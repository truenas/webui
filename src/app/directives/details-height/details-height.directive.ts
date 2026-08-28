import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { WINDOW } from 'app/helpers/window.helper';
import { LayoutService } from 'app/modules/layout/layout.service';

/**
 * This directive is used to dynamically adjust height of the "details" block in a "master-details" layout
 * to fill the bottom space, which becomes available when user scrolls the page down,
 * so the page's heading is shifted off the screen.
 *
 * The block is `position: sticky`, so the space available to it runs from wherever its row has
 * scrolled to - bounded below by the top of the scroll container, where it sticks - down to the
 * bottom of the screen. The top is measured off the row rather than off the block itself, because
 * the block's own position is a function of the height being set here (it sticks, so
 * `getBoundingClientRect()` reports where it is pinned, not where it sits in the document), and
 * measuring it would feed the height back into itself.
 */
@Directive({
  selector: '[ixDetailsHeight]',
  host: {
    '(window:resize)': 'applyHeight()',
  },
})
export class DetailsHeightDirective implements OnInit, OnDestroy {
  private window = inject<Window>(WINDOW);
  private element = inject<ElementRef<HTMLElement>>(ElementRef);
  private layoutService = inject(LayoutService);

  private resizeObserver: ResizeObserver | null = null;
  private scrollAnimationFrame: number | null = null;

  ngOnInit(): void {
    this.setupResizeObserver();
    this.applyHeight();
    this.window.addEventListener('scroll', this.onScroll, true);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.scrollAnimationFrame) {
      cancelAnimationFrame(this.scrollAnimationFrame);
    }
    this.window.removeEventListener('scroll', this.onScroll, true);
  }

  applyHeight(): void {
    const container = this.layoutService.getContentContainer();
    const row = this.element.nativeElement.parentElement;
    if (!container || !row) {
      return;
    }

    const containerBox = container.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    const padding = this.getPadding(container);

    const top = Math.max(rowBox.top, containerBox.top + padding.top);
    // The scroll container shrinks to make room for the console footer, so its own bottom
    // already accounts for one being shown.
    const bottom = containerBox.bottom - padding.bottom;

    this.element.nativeElement.style.height = `${Math.floor(Math.max(bottom - top, 0))}px`;
  }

  private onScroll = (): void => {
    if (this.scrollAnimationFrame) {
      cancelAnimationFrame(this.scrollAnimationFrame);
    }

    this.scrollAnimationFrame = requestAnimationFrame(() => this.applyHeight());
  };

  private setupResizeObserver(): void {
    const container = this.layoutService.getContentContainer();
    if (!container) {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => this.applyHeight());
    this.resizeObserver.observe(container);
  }

  private getPadding(element: HTMLElement): { top: number; bottom: number } {
    const style = this.window.getComputedStyle(element, null);

    return {
      top: parseFloat(style.getPropertyValue('padding-top')) || 0,
      bottom: parseFloat(style.getPropertyValue('padding-bottom')) || 0,
    };
  }
}

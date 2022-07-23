import {
  Directive, ElementRef, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges,
} from '@angular/core';
import { WINDOW } from 'app/helpers/window.helper';

/**
 * This directive is used to dynamically adjust height of the "details" block in a "master-details" layout
 * to fill the bottom space, which becomes available when user scrolls the page down,
 * so the page's heading is shifted off the screen
 */
@Directive({
  selector: '[ixDetailsHeight]',
})
export class IxDetailsHeightDirective implements OnInit, OnDestroy, OnChanges {
  @Input() ixDetailsHeightParentClass: string;
  @Input() hasConsoleFooter = false;
  @Input() headerHeight = 0;
  @Input() footerHeight = 0;

  private readonly onScrollHandler = this.onScroll.bind(this);

  private parentPadding = 0;
  private heightBaseOffset = 0;
  private scrollBreakingPoint = 0;
  private heightCssValue = `calc(100vh - ${this.heightBaseOffset}px)`;

  constructor(
    @Inject(WINDOW) private window: Window,
    private element: ElementRef,
  ) {}

  ngOnInit(): void {
    this.element.nativeElement.style.height = this.heightCssValue;
    this.window.addEventListener('scroll', this.onScrollHandler, true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('hasConsoleFooter' in changes) {
      delete this.heightBaseOffset;
    }
  }

  ngOnDestroy(): void {
    this.window.removeEventListener('scroll', this.onScrollHandler, true);
  }

  onScroll(event: Event): void {
    const eventTarget = event.target as HTMLElement;
    if (!eventTarget.className.includes(this.ixDetailsHeightParentClass)) {
      return;
    }

    if (!this.parentPadding) {
      this.parentPadding = parseFloat(
        this.window
          .getComputedStyle(eventTarget, null)
          .getPropertyValue('padding-bottom'),
      );
    }

    if (!this.heightBaseOffset) {
      this.heightBaseOffset = this.getBaseOffset();
    }

    if (!this.scrollBreakingPoint) {
      this.scrollBreakingPoint = this.getScrollBreakingPoint();
    }

    if ((event.target as HTMLElement).scrollTop < this.scrollBreakingPoint) {
      this.heightCssValue = `calc(100vh - ${this.heightBaseOffset}px + ${eventTarget.scrollTop}px)`;
    } else {
      this.heightCssValue = `calc(100vh - ${this.heightBaseOffset}px + ${this.scrollBreakingPoint}px)`;
    }

    this.element.nativeElement.style.height = this.heightCssValue;
  }

  private getInitialTopPosition(element: HTMLElement): number {
    return element.getBoundingClientRect().top;
  }

  private getBaseOffset(): number {
    let result = this.getInitialTopPosition(this.element.nativeElement);
    result += this.parentPadding;
    if (this.hasConsoleFooter) {
      result += this.footerHeight;
    } else {
      result += this.parentPadding;
    }
    return result;
  }

  private getScrollBreakingPoint(): number {
    let result = this.getInitialTopPosition(this.element.nativeElement);
    result -= this.parentPadding;
    result -= this.headerHeight;
    return result;
  }
}

import {
  Directive, ElementRef, HostListener, Inject, OnDestroy, OnInit, OnChanges,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { WINDOW } from 'app/helpers/window.helper';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { headerHeight, footerHeight } from 'app/modules/layout/admin-layout/admin-layout.component.const';
import { LayoutService } from 'app/modules/layout/layout.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

/**
 * This directive is used to dynamically adjust height of the "details" block in a "master-details" layout
 * to fill the bottom space, which becomes available when user scrolls the page down,
 * so the page's heading is shifted off the screen
 */
@UntilDestroy()
@Directive({
  selector: '[ixDetailsHeight]',
  standalone: true,
})
export class DetailsHeightDirective implements OnInit, OnDestroy, OnChanges {
  private hasConsoleFooter = false;
  private headerHeight = headerHeight;
  private footerHeight = footerHeight;

  private parentPadding = 0;
  private heightBaseOffset = 0;
  private scrollBreakingPoint = 0;
  private heightCssValue = '';

  private resizeObserver: ResizeObserver | null = null;
  private scrollAnimationFrame: number | null = null;

  constructor(
    @Inject(WINDOW) private window: Window,
    private element: ElementRef<HTMLElement>,
    private layoutService: LayoutService,
    private store$: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.setupResizeObserver();
    this.listenForConsoleFooterChanges();
    this.precalculateHeights();
    this.applyHeight();
    this.window.addEventListener('scroll', this.onScroll.bind(this), true);
    setTimeout(() => this.onResize());
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if ('hasConsoleFooter' in changes) {
      this.precalculateHeights();
      this.applyHeight();
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.scrollAnimationFrame) {
      cancelAnimationFrame(this.scrollAnimationFrame);
    }
    this.window.removeEventListener('scroll', this.onScroll.bind(this), true);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.precalculateHeights();
    this.applyHeight();
  }

  onScroll(): void {
    if (this.scrollAnimationFrame) {
      cancelAnimationFrame(this.scrollAnimationFrame);
    }

    this.scrollAnimationFrame = requestAnimationFrame(() => {
      const parentElement = this.layoutService.getContentContainer();
      if (!parentElement) {
        return;
      }

      const scrollTop = parentElement.scrollTop;

      if (scrollTop < this.scrollBreakingPoint) {
        this.heightCssValue = `calc(100vh - ${this.heightBaseOffset + 18}px + ${scrollTop}px)`;
      } else {
        this.heightCssValue = `calc(100vh - ${this.heightBaseOffset}px + ${this.scrollBreakingPoint}px)`;
      }

      this.element.nativeElement.style.height = this.heightCssValue;
    });
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.precalculateHeights();
      this.applyHeight();
    });

    const parentElement = this.layoutService.getContentContainer();
    if (parentElement) {
      this.resizeObserver.observe(parentElement);
    }
  }

  private precalculateHeights(): void {
    const parentElement = this.layoutService.getContentContainer();
    if (!parentElement) {
      return;
    }

    this.parentPadding = parseFloat(
      this.window.getComputedStyle(parentElement, null).getPropertyValue('padding-bottom'),
    ) || 0;

    this.heightBaseOffset = this.calculateBaseOffset();
    this.scrollBreakingPoint = this.calculateScrollBreakingPoint();
    this.heightCssValue = `calc(100vh - ${this.heightBaseOffset}px)`;
  }

  private applyHeight(): void {
    this.element.nativeElement.style.height = this.heightCssValue;
  }

  private calculateBaseOffset(): number {
    let result = this.getInitialTopPosition(this.element.nativeElement);
    result += this.parentPadding;
    if (this.hasConsoleFooter) {
      result += this.footerHeight;
    }
    return Math.floor(result);
  }

  private calculateScrollBreakingPoint(): number {
    let result = this.getInitialTopPosition(this.element.nativeElement);
    result -= this.parentPadding;
    result -= this.headerHeight;
    return Math.max(Math.floor(result), 0);
  }

  private getInitialTopPosition(element: HTMLElement): number {
    return Math.floor(element.getBoundingClientRect().top);
  }

  private listenForConsoleFooterChanges(): void {
    this.store$
      .pipe(waitForAdvancedConfig, untilDestroyed(this))
      .subscribe((advancedConfig) => {
        this.hasConsoleFooter = advancedConfig.consolemsg;
        this.precalculateHeights();
        this.applyHeight();
      });
  }
}

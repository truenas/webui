import {
  Directive, ElementRef, HostListener, Inject, OnChanges, OnDestroy, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { WINDOW } from 'app/helpers/window.helper';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { headerHeight, footerHeight } from 'app/modules/layout/admin-layout/admin-layout.component.const';
import { LayoutService } from 'app/services/layout.service';
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

  private readonly onScrollHandler = this.onScroll.bind(this);

  private parentPadding = 0;
  private heightBaseOffset = 0;
  private scrollBreakingPoint = 0;
  private heightCssValue = `calc(100vh - ${this.heightBaseOffset}px)`;

  constructor(
    @Inject(WINDOW) private window: Window,
    private element: ElementRef<HTMLElement>,
    private layoutService: LayoutService,
    private store$: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.listenForConsoleFooterChanges();

    this.element.nativeElement.style.height = this.heightCssValue;
    this.window.addEventListener('scroll', this.onScrollHandler, true);
    setTimeout(() => this.onScroll());
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if ('hasConsoleFooter' in changes) {
      delete this.heightBaseOffset;
    }
  }

  ngOnDestroy(): void {
    this.window.removeEventListener('scroll', this.onScrollHandler, true);
  }

  @HostListener('window:resize')
  listenForScreenSizeChanges(): void {
    this.heightBaseOffset = this.getBaseOffset();
    this.scrollBreakingPoint = this.getScrollBreakingPoint();
  }

  onScroll(): void {
    const parentElement = this.layoutService.getContentContainer();

    if (!parentElement) {
      return;
    }

    if (!this.parentPadding) {
      this.parentPadding = parseFloat(
        this.window
          .getComputedStyle(parentElement, null)
          .getPropertyValue('padding-bottom'),
      );
    }

    if (!this.heightBaseOffset) {
      this.heightBaseOffset = this.getBaseOffset();
    }

    if (!this.scrollBreakingPoint) {
      this.scrollBreakingPoint = this.getScrollBreakingPoint();
    }

    if (parentElement.scrollTop < this.scrollBreakingPoint) {
      this.heightCssValue = `calc(100vh - ${this.heightBaseOffset + 18}px + ${parentElement.scrollTop}px)`;
    } else {
      this.heightCssValue = `calc(100vh - ${this.heightBaseOffset}px + ${this.scrollBreakingPoint}px)`;
    }

    this.element.nativeElement.style.height = this.heightCssValue;
  }

  private getInitialTopPosition(element: HTMLElement): number {
    return Math.floor(element.getBoundingClientRect().top);
  }

  private getBaseOffset(): number {
    let result = this.getInitialTopPosition(this.element.nativeElement);
    result += this.parentPadding;
    if (this.hasConsoleFooter) {
      result += this.footerHeight;
    }
    return Math.floor(result);
  }

  private getScrollBreakingPoint(): number {
    let result = this.getInitialTopPosition(this.element.nativeElement);
    result -= this.parentPadding;
    result -= this.headerHeight;
    return Math.max(Math.floor(result), 0);
  }

  private listenForConsoleFooterChanges(): void {
    this.store$
      .pipe(waitForAdvancedConfig, untilDestroyed(this))
      .subscribe((advancedConfig) => {
        this.hasConsoleFooter = advancedConfig.consolemsg;
      });
  }
}

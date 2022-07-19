import {
  Directive, ElementRef, Inject, Input, OnDestroy, OnInit,
} from '@angular/core';
import { WINDOW } from 'app/helpers/window.helper';

///
/// This directive is used to dynamically adjust height of the "details" block in a "master-details" layout
/// to fill the bottom space, which becomes available when user scrolls the page down,
/// so the page's heading is shifted off the screen
///
@Directive({
  selector: '[ixDetailsHeight]',
})
export class IxDetailsHeightDirective implements OnInit, OnDestroy {
  @Input() ixDetailsHeightParentClass: string;
  @Input() hiddenHeight = 230;
  @Input() maxShowHeight = 150;

  readonly onScrollHandler = this.onScroll.bind(this);
  heightDetails = `calc(100vh - ${this.hiddenHeight}px)`;

  constructor(
    @Inject(WINDOW) private window: Window,
    private el: ElementRef,
  ) {}

  ngOnInit(): void {
    this.el.nativeElement.style.height = this.heightDetails;
    this.window.addEventListener('scroll', this.onScrollHandler, true);
  }

  ngOnDestroy(): void {
    this.window.removeEventListener('scroll', this.onScrollHandler, true);
  }

  onScroll(event: Event): void {
    if ((event.target as HTMLElement).className !== this.ixDetailsHeightParentClass) {
      return;
    }

    if ((event.target as HTMLElement).scrollTop < this.maxShowHeight) {
      this.heightDetails = `calc(100vh - ${this.hiddenHeight}px + ${(event.target as HTMLElement).scrollTop}px)`;
    } else {
      this.heightDetails = `calc(100vh - ${this.hiddenHeight}px + ${this.maxShowHeight}px)`;
    }

    this.el.nativeElement.style.height = this.heightDetails;
  }
}

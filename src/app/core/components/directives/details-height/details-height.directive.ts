import {
  Directive, ElementRef, Inject, Input, OnDestroy, OnInit,
} from '@angular/core';
import { WINDOW } from 'app/helpers/window.helper';

@Directive({
  selector: '[ixDetailsHeight]',
})
export class IxDetailsHeightDirective implements OnInit, OnDestroy {
  @Input() ixDetailsHeightParantClass: string;
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
    if ((event.target as HTMLElement).className === this.ixDetailsHeightParantClass) {
      if ((event.target as HTMLElement).scrollTop < this.maxShowHeight) {
        this.heightDetails = `calc(100vh - ${this.hiddenHeight}px + ${(event.target as HTMLElement).scrollTop}px)`;
      } else {
        this.heightDetails = `calc(100vh - ${this.hiddenHeight}px + ${this.maxShowHeight}px)`;
      }
      this.el.nativeElement.style.height = this.heightDetails;
    }
  }
}

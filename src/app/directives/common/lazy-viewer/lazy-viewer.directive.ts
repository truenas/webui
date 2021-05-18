import {
  Directive, OnInit, Input, ElementRef, Renderer2, HostListener,
} from '@angular/core';

/*
 * This directive hides elements with the provided selector
 * when they are out of view
 * */

@Directive({
  selector: '[lazyViewer]',
})
export class LazyViewerDirective {
  @Input() container?: string;
  @Input() view?: string;
}

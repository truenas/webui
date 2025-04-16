import { AfterViewInit, Directive, ElementRef } from '@angular/core';
import { focusableElements } from 'app/directives/autofocus/focusable-elements.const';

/**
 * Puts focus on a nested input, textarea or select.
 */
@Directive({
  selector: '[ixAutofocus]',
  standalone: true,
})
export class AutofocusDirective implements AfterViewInit {
  constructor(private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    // Do not intercept focus when a full-screen dialog is open.
    const rootNode = this.host.nativeElement.getRootNode() as HTMLElement;
    if (rootNode.querySelector('ix-full-screen-dialog')) return;
    this.host.nativeElement.querySelector<HTMLElement>(focusableElements)?.focus();
  }
}

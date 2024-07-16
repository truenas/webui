import { AfterViewInit, Directive, ElementRef } from '@angular/core';

/**
 * Puts focus on a nested input, textarea or select.
 */
@Directive({
  selector: '[ixAutofocus]',
})
export class AutofocusDirective implements AfterViewInit {
  constructor(private host: ElementRef) {}

  ngAfterViewInit(): void {
    (this.host.nativeElement as HTMLElement).querySelector<HTMLElement>('input, textarea, select').focus();
  }
}

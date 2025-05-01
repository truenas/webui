import {
  Directive,
  ElementRef,
  input,
  OnChanges,
  Renderer2,
} from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';

@Directive({
  selector: '[safeInnerHtml]',
})
export class SafeInnerHtmlDirective implements OnChanges {
  dirtyHtml = input.required<string | SafeHtml>({ alias: 'safeInnerHtml' });

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(changes: IxSimpleChanges<SafeInnerHtmlDirective>): void {
    if ('dirtyHtml' in changes) {
      const clean = DOMPurify.sanitize(this.dirtyHtml().toString());
      this.renderer.setProperty(this.el.nativeElement, 'innerHTML', clean);
    }
  }
}

import {
  Directive,
  ElementRef,
  input,
  OnChanges,
  Renderer2,
} from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { SanitizerService } from 'app/modules/layout/sanitize-html/sanitizer.service';

@Directive({
  selector: '[safeInnerHtml]',
})
export class SafeInnerHtmlDirective implements OnChanges {
  dirtyHtml = input.required<string | SafeHtml>({ alias: 'safeInnerHtml' });

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private sanitizer: SanitizerService,
  ) { }

  ngOnChanges(changes: IxSimpleChanges<SafeInnerHtmlDirective>): void {
    if ('dirtyHtml' in changes) {
      const clean = this.sanitizer.sanitize(this.dirtyHtml()?.toString());
      this.renderer.setProperty(this.el.nativeElement, 'innerHTML', clean);
    }
  }
}

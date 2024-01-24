import {
  Directive, ElementRef, Renderer2, OnInit,
} from '@angular/core';

@Directive({
  selector: '[ixHighlightText]',
})
export class HighlightTextDirective implements OnInit {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderer.addClass(this.el.nativeElement, 'highlighted-text');
  }
}

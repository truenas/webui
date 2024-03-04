import {
  Directive, Input, ElementRef, Renderer2, OnInit,
} from '@angular/core';
import { UiSearchableElement } from 'app/interfaces/ui-searchable-element.interface';

@Directive({
  selector: '[ixUiSearchableElement]',
})
export class UiSearchableElementDirective implements OnInit {
  @Input() ixSearchConfig!: UiSearchableElement;

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  ngOnInit(): void {
    if (this.ixSearchConfig?.anchor) {
      this.renderer.setAttribute(this.el.nativeElement, 'id', this.ixSearchConfig.anchor);
    }
  }
}

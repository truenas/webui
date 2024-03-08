import {
  Directive, Input, ElementRef, Renderer2, OnInit,
} from '@angular/core';
import { generateIdFromHierarchy } from 'app/modules/global-search/helpers/generate-id-from-hierarchy';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

@Directive({
  selector: '[ixUiSearchableElement]',
})
export class UiSearchableElementDirective implements OnInit {
  @Input() ixSearchConfig!: UiSearchableElement;

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  ngOnInit(): void {
    if (this.ixSearchConfig?.hierarchy) {
      this.renderer.setAttribute(this.el.nativeElement, 'id', generateIdFromHierarchy(this.ixSearchConfig?.hierarchy));
    }
  }
}

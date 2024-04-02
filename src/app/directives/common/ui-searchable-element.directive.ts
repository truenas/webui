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
    if (this.ixSearchConfig?.hierarchy || this.ixSearchConfig?.anchor) {
      this.renderer.setAttribute(
        this.el.nativeElement,
        'id',
        this.ixSearchConfig.anchor || generateIdFromHierarchy(this.ixSearchConfig?.hierarchy),
      );
    }
  }
}

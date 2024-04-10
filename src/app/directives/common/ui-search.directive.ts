import {
  Directive, Input, ElementRef, Renderer2, OnInit,
} from '@angular/core';
import { generateIdFromHierarchy } from 'app/modules/global-search/helpers/generate-id-from-hierarchy';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

@Directive({
  selector: '[ixUiSearch]',
})
export class UiSearchDirective implements OnInit {
  @Input({ required: true, alias: 'ixUiSearch' }) config: UiSearchableElement;

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  ngOnInit(): void {
    if (this.config.hierarchy || this.config.anchor) {
      this.renderer.setAttribute(
        this.el.nativeElement,
        'id',
        this.config.anchor || generateIdFromHierarchy(this.config.hierarchy),
      );
    }
  }
}

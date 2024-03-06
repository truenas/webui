import {
  Directive, Input, ElementRef, Renderer2, OnInit,
} from '@angular/core';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

@Directive({
  selector: '[ixUiSearchableElement]',
})
export class UiSearchableElementDirective implements OnInit {
  @Input() ixSearchConfig!: UiSearchableElement;

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  private generateDynamicId(): string {
    const id = this.ixSearchConfig.hierarchy.join('-').toLowerCase();
    return id.replace(/\s+/g, '_');
  }

  ngOnInit(): void {
    if (this.ixSearchConfig?.hierarchy) {
      this.renderer.setAttribute(this.el.nativeElement, 'id', this.generateDynamicId());
    }
  }
}

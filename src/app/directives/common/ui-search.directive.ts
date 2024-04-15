import {
  Directive, Input, ElementRef, Renderer2, OnInit,
  OnDestroy,
} from '@angular/core';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { getSearchableElementId } from 'app/modules/global-search/helpers/get-searchable-element-id';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';

@Directive({
  selector: '[ixUiSearch]',
})
export class UiSearchDirective implements OnInit, OnDestroy {
  @Input({ required: true, alias: 'ixUiSearch' }) config: UiSearchableElement;

  get id(): string {
    return getSearchableElementId(this.config);
  }

  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef<HTMLElement>,
    private searchDirectives: UiSearchDirectivesService,
  ) {}

  ngOnInit(): void {
    if (this.id) {
      this.renderer.setAttribute(this.elementRef.nativeElement, 'id', this.id);
    }
    this.searchDirectives.register(this);
  }

  ngOnDestroy(): void {
    this.searchDirectives.unregister(this);
  }

  highlight(): void {
    this.tryHighlightAnchors(0);
  }

  private tryHighlightAnchors(attemptCount: number): void {
    if (this.elementRef.nativeElement) {
      this.highlightAndClickElement();
    } else if (attemptCount < 2) {
      setTimeout(() => this.tryHighlightAnchors(attemptCount + 1), searchDelayConst * 3);
    }
  }

  private highlightAndClickElement(): void {
    this.elementRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
    this.elementRef.nativeElement.focus();

    this.renderer.addClass(this.elementRef.nativeElement, 'search-element-highlighted');

    setTimeout(() => this.elementRef.nativeElement.click(), searchDelayConst);
    setTimeout(
      () => this.renderer.removeClass(this.elementRef.nativeElement, 'search-element-highlighted'),
      searchDelayConst * 10,
    );
  }
}

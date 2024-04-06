import {
  Directive, Input, ElementRef, Renderer2, OnInit, OnDestroy,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { generateIdFromHierarchy } from 'app/modules/global-search/helpers/generate-id-from-hierarchy';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { UiSearchableDirectiveService } from 'app/modules/global-search/services/ui-searchable-directive.service';

@UntilDestroy()
@Directive({
  selector: '[ixUiSearchableElement]',
})
export class UiSearchableElementDirective implements OnInit, OnDestroy {
  @Input() ixSearchConfig!: UiSearchableElement;

  get id(): string {
    return this.ixSearchConfig.anchor || generateIdFromHierarchy(this.ixSearchConfig?.hierarchy || []);
  }

  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef<HTMLElement>,
    private searchableDirectives: UiSearchableDirectiveService,
  ) {}

  ngOnInit(): void {
    if (this.id) {
      this.renderer.setAttribute(this.elementRef.nativeElement, 'id', this.id);
    }
    this.searchableDirectives.register(this);
  }

  ngOnDestroy(): void {
    this.searchableDirectives.unregister(this);
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
      searchDelayConst * 6,
    );
  }
}

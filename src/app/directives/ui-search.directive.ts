import { Directive, ElementRef, Renderer2, OnInit, OnDestroy, input, inject } from '@angular/core';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { getSearchableElementId } from 'app/modules/global-search/helpers/get-searchable-element-id';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';

@Directive({
  selector: '[ixUiSearch]',
})
export class UiSearchDirective implements OnInit, OnDestroy {
  private renderer = inject(Renderer2);
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private searchDirectives = inject(UiSearchDirectivesService);
  private navigateAndHighlight = inject(NavigateAndHighlightService);

  readonly config = input.required<UiSearchableElement>({
    alias: 'ixUiSearch',
  });

  /**
   * When true, the highlight is drawn inside the element (negative
   * outline-offset). Use for master-detail cards whose surrounding scroll
   * container would clip an outset outline.
   */
  readonly inset = input(false, { alias: 'ixUiSearchInset' });

  get id(): string {
    return getSearchableElementId(this.config());
  }

  get ariaLabel(): string {
    const hierarchy = this.config().hierarchy;
    const hierarchyItem = (hierarchy ? hierarchy[hierarchy.length - 1] : '') || '';
    const isSingleWord = hierarchyItem.trim().split(/\s+/).length === 1;

    const synonyms = this.config().synonyms;
    if (isSingleWord && synonyms && Number(synonyms?.length) > 0) {
      return synonyms.reduce((best, synonym) => {
        const synonymWordCount = synonym.trim().split(/\s+/).length;
        const bestWordCount = best.trim().split(/\s+/).length;
        return synonymWordCount > bestWordCount ? synonym : best;
      }, hierarchyItem);
    }
    return hierarchyItem;
  }

  ngOnInit(): void {
    if (this.id) {
      this.renderer.setAttribute(this.elementRef.nativeElement, 'id', this.id);
      this.renderer.setAttribute(this.elementRef.nativeElement, 'aria-label', this.ariaLabel);
    }
    this.searchDirectives.register(this);
  }

  ngOnDestroy(): void {
    this.searchDirectives.unregister(this);
  }

  highlight(parentElement: UiSearchableElement): void {
    this.tryHighlight(parentElement, 0);
  }

  private tryHighlight(element: UiSearchableElement, attemptCount: number): void {
    if (!this.elementRef.nativeElement) {
      if (attemptCount < 2) {
        setTimeout(() => this.tryHighlight(element, attemptCount + 1), searchDelayConst * 3);
      }
      return;
    }

    const targetId = element.anchor && element.anchor !== this.id ? element.anchor : this.id;
    this.navigateAndHighlight.waitForElement(targetId, { inset: this.inset() });
  }
}

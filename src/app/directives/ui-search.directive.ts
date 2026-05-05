import { Directive, ElementRef, Renderer2, OnInit, OnDestroy, input, inject } from '@angular/core';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
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

  // Snapshot at init time so register/unregister always agree on the same key
  // even if `config()` were ever to change. Today `config` is `input.required`
  // and never reassigned, but caching makes the contract explicit and prevents
  // a registry leak if that assumption ever breaks.
  private cachedId = '';

  get id(): string {
    return this.cachedId || getSearchableElementId(this.config());
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
    this.cachedId = getSearchableElementId(this.config());
    if (this.cachedId) {
      this.renderer.setAttribute(this.elementRef.nativeElement, 'id', this.cachedId);
      this.renderer.setAttribute(this.elementRef.nativeElement, 'aria-label', this.ariaLabel);
    }
    this.searchDirectives.register(this);
  }

  ngOnDestroy(): void {
    this.searchDirectives.unregister(this);
  }

  /**
   * Apply the search highlight to this directive's target. If the caller has
   * already resolved the live DOM element (UiSearchDirectivesService does
   * this as part of its visibility check), pass it as `resolvedTarget` to
   * skip the redundant element poll.
   */
  highlight(element: UiSearchableElement, resolvedTarget?: HTMLElement): void {
    // Both `element` and `this.config()` come from the same `*.elements.ts`
    // source — the JSON-extracted entry that drives both the search index and
    // the directive input. The previous `?? this.config().inset` fallback
    // was unreachable in practice, so the inset flag is read directly from
    // the search-result element.
    const inset = element.inset ?? false;
    if (resolvedTarget) {
      this.navigateAndHighlight.highlightResolved(resolvedTarget, { inset });
      return;
    }
    const targetId = element.anchor && element.anchor !== this.id ? element.anchor : this.id;
    this.navigateAndHighlight.waitForElement(targetId, { inset });
  }
}

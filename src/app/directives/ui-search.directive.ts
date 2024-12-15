import {
  Directive, ElementRef, Renderer2, OnInit,
  OnDestroy, input,
} from '@angular/core';
import { Timeout } from 'app/interfaces/timeout.interface';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { getSearchableElementId } from 'app/modules/global-search/helpers/get-searchable-element-id';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';

@Directive({
  selector: '[ixUiSearch]',
  standalone: true,
})
export class UiSearchDirective implements OnInit, OnDestroy {
  readonly config = input.required<UiSearchableElement>({
    alias: 'ixUiSearch',
  });

  get id(): string {
    return getSearchableElementId(this.config());
  }

  get ariaLabel(): string {
    const hierarchyItem = this.config().hierarchy?.[this.config().hierarchy.length - 1] || '';
    const isSingleWord = hierarchyItem.trim().split(/\s+/).length === 1;

    if (isSingleWord && this.config().synonyms?.length > 0) {
      return this.config().synonyms.reduce((best, synonym) => {
        const synonymWordCount = synonym.trim().split(/\s+/).length;
        const bestWordCount = best.trim().split(/\s+/).length;
        return synonymWordCount > bestWordCount ? synonym : best;
      }, hierarchyItem);
    }
    return hierarchyItem;
  }

  private highlightTimeout: Timeout = null;

  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef<HTMLElement>,
    private searchDirectives: UiSearchDirectivesService,
  ) {}

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
    this.tryHighlightAnchors(parentElement, 0);
  }

  private tryHighlightAnchors(element: UiSearchableElement, attemptCount: number): void {
    if (this.elementRef.nativeElement) {
      this.highlightAndClickElement(this.elementRef.nativeElement, !!element.triggerAnchor);
      if (this.elementRef.nativeElement.id !== element.anchor) {
        this.highlightElementAnchor(element.anchor);
      }
    } else if (attemptCount < 2) {
      setTimeout(() => this.tryHighlightAnchors(element, attemptCount + 1), searchDelayConst * 3);
    }
  }

  private highlightElementAnchor(elementAnchor: string): void {
    setTimeout(() => {
      const rootNode = this.elementRef.nativeElement.getRootNode() as HTMLElement;
      const anchorRef: HTMLElement = rootNode?.querySelector(`#${elementAnchor}`);

      if (anchorRef) {
        this.highlightAndClickElement(anchorRef);
      }
    }, searchDelayConst * 1.5);
  }

  private highlightAndClickElement(anchorRef: HTMLElement, shouldClick = false): void {
    if (shouldClick && anchorRef) setTimeout(() => anchorRef.click(), searchDelayConst);

    if (!anchorRef || shouldClick) return;

    this.renderer.addClass(anchorRef, 'search-element-highlighted');

    const removeHighlightStyling = (): void => {
      this.renderer.removeClass(anchorRef, 'search-element-highlighted');
      ['click', 'keydown'].forEach((event) => document.removeEventListener(event, removeHighlightStyling));
    };

    setTimeout(() => {
      anchorRef.focus();
      anchorRef.scrollIntoView();
      document.querySelector<HTMLElement>('.rightside-content-hold').scrollBy(0, -20);
      ['click', 'keydown'].forEach((event) => document.addEventListener(event, removeHighlightStyling, { once: true }));
    }, searchDelayConst);

    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
    }

    this.highlightTimeout = setTimeout(() => removeHighlightStyling(), 4000);
  }
}

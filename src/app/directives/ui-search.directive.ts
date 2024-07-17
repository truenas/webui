import {
  Directive, Input, ElementRef, Renderer2, OnInit,
  OnDestroy,
  Inject,
} from '@angular/core';
import { WINDOW } from 'app/helpers/window.helper';
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

  get ariaLabel(): string {
    const hierarchyItem = this.config.hierarchy?.[this.config.hierarchy.length - 1] || '';
    const isSingleWord = hierarchyItem.trim().split(/\s+/).length === 1;

    if (isSingleWord && this.config.synonyms?.length > 0) {
      return this.config.synonyms.reduce((best, synonym) => {
        const synonymWordCount = synonym.trim().split(/\s+/).length;
        const bestWordCount = best.trim().split(/\s+/).length;
        return synonymWordCount > bestWordCount ? synonym : best;
      }, hierarchyItem);
    }
    return hierarchyItem;
  }

  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef<HTMLElement>,
    private searchDirectives: UiSearchDirectivesService,
    @Inject(WINDOW) private window: Window,
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
    if (!anchorRef) return;

    const arrowPointer = this.createArrowPointer();

    if (shouldClick) setTimeout(() => anchorRef.click(), searchDelayConst);

    setTimeout(() => {
      anchorRef.focus();
      anchorRef.scrollIntoView();
      document.querySelector<HTMLElement>('.rightside-content-hold')?.scrollBy(0, -20);

      if (!shouldClick) this.positionArrowPointer(anchorRef, arrowPointer);
    }, searchDelayConst);

    setTimeout(() => this.removeArrowPointer(arrowPointer), searchDelayConst * 15);

    setTimeout(() => {
      document.addEventListener('click', () => this.removeArrowPointer(arrowPointer), { once: true });
      document.addEventListener('keydown', () => this.removeArrowPointer(arrowPointer), { once: true });
    });
  }

  private positionArrowPointer(anchorRef: HTMLElement, arrowElement: HTMLElement): void {
    const rect = anchorRef.getBoundingClientRect();
    const viewportWidth = this.window.innerWidth;

    if (rect.top === 0) {
      return;
    }

    const topPosition = `${this.window.scrollY + rect.top + rect.height / 2 - 55}px`;
    let leftPosition = `${this.window.scrollX + rect.right - 15}px`;

    if (rect.right + 140 > viewportWidth) {
      leftPosition = `${this.window.scrollX + rect.left - 120}px`;
      this.renderer.addClass(arrowElement, 'arrow-left');
    } else {
      this.renderer.addClass(arrowElement, 'arrow-right');
    }

    this.renderer.setStyle(arrowElement, 'top', topPosition);
    this.renderer.setStyle(arrowElement, 'left', leftPosition);
    this.renderer.setStyle(arrowElement, 'opacity', '1');

    this.renderer.appendChild(this.window.document.body, arrowElement);
  }

  private removeArrowPointer(arrowElement: HTMLElement): void {
    this.renderer.setStyle(arrowElement, 'opacity', '0');
    setTimeout(() => {
      if (arrowElement.parentNode) {
        arrowElement.parentNode.removeChild(arrowElement);
      }
    }, 300);
  }

  private createArrowPointer(): HTMLElement {
    const arrowElement = this.renderer.createElement('div') as HTMLElement;
    this.renderer.addClass(arrowElement, 'arrow-element');

    return arrowElement;
  }
}

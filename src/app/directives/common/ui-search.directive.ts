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

  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef<HTMLElement>,
    private searchDirectives: UiSearchDirectivesService,
    @Inject(WINDOW) private window: Window,
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

    const elementPosition = anchorRef.getBoundingClientRect().top + this.window.pageYOffset;
    this.window.scrollTo({ top: elementPosition - 50, behavior: 'smooth' });
    anchorRef.focus();
    this.renderer.addClass(anchorRef, 'search-element-highlighted');

    if (shouldClick) setTimeout(() => anchorRef.click(), searchDelayConst);

    setTimeout(
      () => {
        this.renderer.removeClass(anchorRef, 'search-element-highlighted');

        if (!shouldClick) {
          anchorRef.focus();
        }
      },
      searchDelayConst * 10,
    );
  }
}

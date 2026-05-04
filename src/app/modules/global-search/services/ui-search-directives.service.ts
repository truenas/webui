import { Injectable, DOCUMENT, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  elementMaxPollAttempts,
  elementPollIntervalMs,
} from 'app/directives/navigate-and-interact/poll-constants';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { getSearchableElementId } from 'app/modules/global-search/helpers/get-searchable-element-id';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

@Injectable({
  providedIn: 'root',
})
export class UiSearchDirectivesService {
  private document = inject<Document>(DOCUMENT);

  private directives = new Set<UiSearchDirective>();
  pendingHighlightElement: UiSearchableElement | null = null;
  directiveAdded$ = new BehaviorSubject<UiSearchDirective | null>(null);

  // Selection-poll state lives here (not on the search component) because the
  // overlay component is often destroyed mid-poll — by focus shifts when a
  // mat-menu opens, by the auto-detach 150ms after selection, etc. Anchoring
  // the timer to a root-providedIn service lets the highlight finish even
  // after the search UI tears down.
  private pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // TODO: Refactor out and just access property directly?
  get pendingUiHighlightElement(): UiSearchableElement | null {
    return this.pendingHighlightElement;
  }

  size(): number {
    return this.directives.size;
  }

  get(element: UiSearchableElement): UiSearchDirective | null {
    const elementId = getSearchableElementId(element);
    for (const directive of this.directives.values()) {
      if (directive.id === elementId) {
        return directive;
      }
    }
    return null;
  }

  setPendingUiHighlightElement(element: UiSearchableElement | null): void {
    this.pendingHighlightElement = element;
  }

  register(directive: UiSearchDirective): void {
    this.directives.add(directive);
    this.directiveAdded$.next(directive);
  }

  unregister(directive: UiSearchDirective): void {
    this.directives.delete(directive);
  }

  requestHighlight(config: UiSearchableElement): void {
    this.cancelPendingHighlight();
    this.setPendingUiHighlightElement(config);
    this.pollForSelection(config, 0, false);
  }

  cancelPendingHighlight(): void {
    if (this.pendingTimeoutId !== null) {
      clearTimeout(this.pendingTimeoutId);
      this.pendingTimeoutId = null;
    }
  }

  private pollForSelection(config: UiSearchableElement, attempt: number, triggerFired: boolean): void {
    const directive = this.get(config);
    let nextTriggerFired = triggerFired;

    // Apply the highlight only when the directive is registered AND its host
    // element is actually in the live DOM AND visible (non-display:none).
    // mat-menu items in a closed menu can have their directive registered
    // with a detached host. Master-detail cards (e.g. Manage User Quotas
    // inside the dataset details panel) keep their `<a>` in the DOM but
    // wrapped in a `display: none` container until the panel opens — adding
    // the highlight class there paints onto an invisible element and burns
    // the 4-second timer with nothing on screen.
    if (directive) {
      const targetId = config.anchor && config.anchor !== directive.id ? config.anchor : directive.id;
      const targetElement = this.document.getElementById(targetId);
      if (targetElement && targetElement.offsetParent !== null) {
        // Self-trigger entry (e.g. "Settings Menu" — the trigger button is
        // its own anchor): also click to expand its dropdown so the user
        // sees its contents. Skip the click if the menu is already open
        // (aria-expanded="true") — clicking would toggle it closed.
        if (
          !triggerFired
          && config.triggerAnchor
          && config.triggerAnchor === directive.id
          && targetElement.getAttribute('aria-expanded') !== 'true'
        ) {
          this.fireTrigger(config.triggerAnchor);
        }
        this.applyHighlight(directive, config, targetElement);
        return;
      }
    }

    // Fire the parent trigger ONCE per selection — only if we have one, the
    // trigger is in the DOM (page is loaded), and we haven't already fired.
    if (
      !triggerFired
      && config.triggerAnchor
      && this.document.getElementById(config.triggerAnchor)
    ) {
      this.fireTrigger(config.triggerAnchor);
      nextTriggerFired = true;
    }

    if (attempt >= elementMaxPollAttempts) {
      if (this.pendingHighlightElement === config) {
        this.setPendingUiHighlightElement(null);
      }
      return;
    }

    this.pendingTimeoutId = setTimeout(
      () => this.pollForSelection(config, attempt + 1, nextTriggerFired),
      elementPollIntervalMs,
    );
  }

  private fireTrigger(triggerAnchor: string): void {
    this.document.getElementById(triggerAnchor)?.click();
  }

  private applyHighlight(
    directive: UiSearchDirective,
    config: UiSearchableElement,
    targetElement: HTMLElement,
  ): void {
    this.pendingTimeoutId = null;
    this.setPendingUiHighlightElement(null);
    // Hand the already-resolved target to the directive so the highlight
    // service skips its own poll — we just verified the element is in the
    // DOM and visible, no need to look it up again.
    directive.highlight(config, targetElement);
  }
}

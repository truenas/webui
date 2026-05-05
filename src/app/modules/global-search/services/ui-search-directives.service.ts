import { Injectable, DOCUMENT, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
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
  private navigateAndHighlight = inject(NavigateAndHighlightService);

  // Keyed by `directive.id` for O(1) lookup. Element ids come from
  // `getSearchableElementId(config)` over the static `*.elements.ts` data, so
  // a directive's id is effectively immutable for its lifetime — caching the
  // key at register time is safe and avoids re-scanning the registry on every
  // poll iteration (~5000 lookups per failed selection poll otherwise).
  private directives = new Map<string, UiSearchDirective>();
  pendingUiHighlightElement: UiSearchableElement | null = null;
  directiveAdded$ = new BehaviorSubject<UiSearchDirective | null>(null);

  // Selection-poll state lives here (not on the search component) because the
  // overlay component is often destroyed mid-poll — by focus shifts when a
  // mat-menu opens, by the auto-detach 150ms after selection, etc. Anchoring
  // the timer to a root-providedIn service lets the highlight finish even
  // after the search UI tears down.
  private pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;

  size(): number {
    return this.directives.size;
  }

  get(element: UiSearchableElement): UiSearchDirective | null {
    return this.directives.get(getSearchableElementId(element)) ?? null;
  }

  setPendingUiHighlightElement(element: UiSearchableElement | null): void {
    this.pendingUiHighlightElement = element;
  }

  register(directive: UiSearchDirective): void {
    this.directives.set(directive.id, directive);
    this.directiveAdded$.next(directive);
  }

  unregister(directive: UiSearchDirective): void {
    // Only delete if the registered directive at this id is still the one
    // unregistering — otherwise a re-registered directive that took over the
    // id would be wiped by a stale unregister call.
    if (this.directives.get(directive.id) === directive) {
      this.directives.delete(directive.id);
    }
  }

  requestHighlight(config: UiSearchableElement): void {
    this.cancelPendingHighlight();
    // Pre-empt any in-flight poll on the highlight service too — e.g. a
    // master-detail back link that called `navigateAndHighlight()` and is
    // still waiting for its target. Without this, the older poll could
    // resolve mid-selection and steal focus / repaint a stale highlight on
    // top of the new one.
    this.navigateAndHighlight.cancelPendingHighlight();
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
        this.applyHighlight(directive, config, targetElement, triggerFired);
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
      if (this.pendingUiHighlightElement === config) {
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
    triggerFired: boolean,
  ): void {
    this.pendingTimeoutId = null;
    this.setPendingUiHighlightElement(null);
    // Self-trigger entry (e.g. "Settings Menu" — the trigger button is its
    // own anchor): click to expand its dropdown so the user sees its
    // contents. Skip when the parent poll already fired it via the
    // triggerAnchor branch — otherwise the dropdown opens twice (once when
    // the trigger fires, once here), which can look like a flicker if CDK
    // hasn't synced `aria-expanded` yet between the two clicks.
    // The `aria-expanded !== 'true'` check is a secondary guard for the
    // already-open case (the dropdown was open before the search ran).
    if (
      !triggerFired
      && config.triggerAnchor
      && config.triggerAnchor === directive.id
      && targetElement.getAttribute('aria-expanded') !== 'true'
    ) {
      this.fireTrigger(config.triggerAnchor);
    }
    // Hand the already-resolved target to the directive so the highlight
    // service skips its own poll — we just verified the element is in the
    // DOM and visible, no need to look it up again.
    directive.highlight(config, targetElement);
  }
}

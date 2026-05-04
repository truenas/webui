import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import {
  elementMaxPollAttempts,
  elementPollIntervalMs,
} from 'app/directives/navigate-and-interact/poll-constants';
import { WINDOW } from 'app/helpers/window.helper';
import { FocusService } from 'app/services/focus.service';

export const highlightTargetClass = 'ix-highlight-target';
export const highlightTargetInsetClass = 'ix-highlight-target-inset';

const highlightDurationMs = 4000;
const lateFocusDelayMs = 350;

// Keys that signal "I'm done with this highlight" — Escape (explicit dismiss)
// and Tab (leaving the element). Arrow keys, character input, and modifier-
// only presses must NOT dismiss, otherwise the first keystroke a keyboard
// user makes after landing on the target instantly removes the highlight that
// helped them locate it.
const dismissKeys = new Set(['Escape', 'Tab']);

export interface WaitForElementOptions {
  block?: ScrollLogicalPosition;
  /**
   * Draw the highlight outline inset (inside the element edge) instead of
   * outset. Use for elements whose surrounding overflow:hidden parent would
   * clip an outset outline — e.g. master-detail cards.
   */
  inset?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NavigateAndHighlightService {
  private readonly destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private window = inject<Window>(WINDOW);
  private focusService = inject(FocusService);

  private prevHighlightTarget: HTMLElement | null = null;
  private prevTabindexAdded = false;
  private prevSubscription: Subscription | null = null;
  private listenerAbortController: AbortController | null = null;
  private pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private lateFocusTimeoutId: ReturnType<typeof setTimeout> | null = null;
  // Bumped exactly once per public entry (navigateAndHighlight /
  // waitForElement / highlightResolved). Two invariants depend on it:
  //   1. The router promise's .then() in navigateAndHighlight captures the
  //      token at call time and bails if a newer call has bumped it —
  //      otherwise a stale router resolution would start a fresh poll for
  //      the previous hash.
  //   2. Direct callers of waitForElement / highlightResolved (e.g.
  //      UiSearchDirective) bump the token so any in-flight navigateAndHighlight
  //      whose router promise hasn't resolved yet gets cancelled before it
  //      can start polling for an outdated target.
  // Internal callers (e.g. navigateAndHighlight → pollForElement) MUST go
  // through the private path to avoid re-bumping mid-flight.
  private currentNavigationToken = 0;

  navigateAndHighlight(route: string[], hash?: string, options?: WaitForElementOptions): void {
    this.cancelPendingTimeout();
    const token = ++this.currentNavigationToken;

    this.router.navigate(route, { fragment: hash }).then(() => {
      if (token !== this.currentNavigationToken || !hash) {
        return;
      }

      this.pollForElement(hash, 0, options);
    });
  }

  /**
   * Polls for an element by id and highlights + focuses it once it is in the
   * DOM AND laid out (non-zero size). Waits up to 5s. A new call cancels the
   * previous in-flight poll so only the most recent target is highlighted.
   */
  waitForElement(hash: string, options?: WaitForElementOptions): void {
    this.cancelPendingTimeout();
    this.currentNavigationToken++;
    this.pollForElement(hash, 0, options);
  }

  /**
   * Highlight an already-resolved DOM element, skipping the poll. Use when the
   * caller has independently verified the element is in the DOM and visible
   * (e.g. UiSearchDirectivesService's directive-level visibility check) — this
   * avoids re-polling for an element we already have.
   */
  highlightResolved(target: HTMLElement, options?: WaitForElementOptions): void {
    this.cancelPendingTimeout();
    this.currentNavigationToken++;
    this.scrollIntoView(target, options);
  }

  private pollForElement(hash: string, attemptCount: number, options?: WaitForElementOptions): void {
    const htmlElement = this.window.document.getElementById(hash);

    if (htmlElement) {
      this.pendingTimeoutId = null;
      this.scrollIntoView(htmlElement, options);
    } else if (attemptCount < elementMaxPollAttempts) {
      this.pendingTimeoutId = setTimeout(() => {
        this.pollForElement(hash, attemptCount + 1, options);
      }, elementPollIntervalMs);
    } else {
      this.pendingTimeoutId = null;
    }
  }

  scrollIntoView(htmlElement: HTMLElement, options?: WaitForElementOptions): void {
    htmlElement.scrollIntoView({ block: options?.block ?? 'center' });
    this.highlight(htmlElement, { inset: options?.inset });
  }

  highlight(targetElement: HTMLElement, options?: { inset?: boolean }): void {
    if (!targetElement) return;

    this.cleanupPreviousHighlight();

    const className = options?.inset ? highlightTargetInsetClass : highlightTargetClass;
    targetElement.classList.add(className);
    this.prevHighlightTarget = targetElement;

    this.focusTarget(targetElement);

    this.prevSubscription = timer(highlightDurationMs)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cleanupPreviousHighlight());

    // One controller covers all dismiss listeners so they tear down together
    // via abort() in cleanupPreviousHighlight.
    this.listenerAbortController = new AbortController();
    const { signal } = this.listenerAbortController;

    targetElement.addEventListener('click', () => this.cleanupPreviousHighlight(), { signal });

    this.window.document.addEventListener(
      'click',
      (event: MouseEvent) => {
        if (!targetElement.contains(event.target as Node)) {
          this.cleanupPreviousHighlight();
        }
      },
      { capture: true, signal },
    );

    this.window.document.addEventListener(
      'keydown',
      (event: KeyboardEvent) => {
        // mat-menu items rely on the browser's default Enter→click. Inside a
        // menu, that default can fail to reach the focused row in some
        // menu/keymanager states, so we hijack Enter at the capture phase
        // for the focused item inside the same menu panel as the highlight
        // target and click it explicitly. Outside of menus, the browser's
        // native Enter handling on focusable elements is sufficient and we
        // must NOT pre-empt it (would double-fire or stomp on bespoke
        // Enter handlers on the host). Verified against @angular/cdk 21.x.
        if (event.key === 'Enter') {
          const targetMenuPanel = targetElement.closest('.mat-mdc-menu-panel');
          if (targetMenuPanel) {
            const focused = this.window.document.activeElement;
            const focusedIsInSameMenu = focused instanceof HTMLElement
              && targetMenuPanel.contains(focused)
              && focused.classList.contains('mat-mdc-menu-item');
            if (focusedIsInSameMenu) {
              event.stopPropagation();
              event.preventDefault();
              (focused as HTMLElement).click();
              return;
            }
          }
        }
        if (dismissKeys.has(event.key)) {
          this.cleanupPreviousHighlight();
        }
      },
      { capture: true, signal },
    );
  }

  private focusTarget(target: HTMLElement): void {
    // mat-menu has its own FocusKeyManager that tracks `_activeItem`
    // independently of the actual focused DOM element. If we just focus
    // `target` programmatically, KeyManager's _activeItem stays as the menu's
    // first item — so subsequent arrow keys / Enter act on the wrong row.
    // Walk the KeyManager forward via synthetic ArrowDown events until its
    // _activeItem matches our target (each ArrowDown advances _activeItem AND
    // focuses the new item, so when the loop ends focus is on `target` AND
    // the keymanager is in sync). Verified against @angular/cdk 21.x.
    const menuPanel = target.closest<HTMLElement>('.mat-mdc-menu-panel');
    if (menuPanel) {
      const items = Array.from(menuPanel.querySelectorAll<HTMLElement>('.mat-mdc-menu-item'));
      const targetIndex = items.indexOf(target);
      for (let i = 0; i < targetIndex; i++) {
        // Angular CDK's FocusKeyManager still reads `event.keyCode` (deprecated
        // but live in the lib). The KeyboardEvent constructor ignores keyCode,
        // so we patch it after construction — otherwise the synthetic event is
        // a no-op for the manager and _activeItem stays at the menu's first
        // item, leaving the user's keyboard nav broken after the highlight.
        const event = new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(event, 'keyCode', { value: 40 }); // DOWN_ARROW
        Object.defineProperty(event, 'which', { value: 40 });
        menuPanel.dispatchEvent(event);
      }
      this.prevTabindexAdded = false;
      return;
    }

    this.prevTabindexAdded = this.focusService.focusWithFallback(target, { preventScroll: true });

    // cdk overlays and slide-ins auto-focus their own first item after open
    // animations finish (~250-300ms). Reclaim focus once that has settled so
    // the user lands on the searched-for item.
    this.lateFocusTimeoutId = setTimeout(() => {
      this.lateFocusTimeoutId = null;
      if (this.prevHighlightTarget === target && this.window.document.activeElement !== target) {
        target.focus({ preventScroll: true });
      }
    }, lateFocusDelayMs);
  }

  private cancelPendingTimeout(): void {
    if (this.pendingTimeoutId !== null) {
      clearTimeout(this.pendingTimeoutId);
      this.pendingTimeoutId = null;
    }
  }

  private cancelLateFocus(): void {
    if (this.lateFocusTimeoutId !== null) {
      clearTimeout(this.lateFocusTimeoutId);
      this.lateFocusTimeoutId = null;
    }
  }

  private cleanupPreviousHighlight(): void {
    if (this.prevHighlightTarget) {
      this.prevHighlightTarget.classList.remove(highlightTargetClass);
      this.prevHighlightTarget.classList.remove(highlightTargetInsetClass);
      if (this.prevTabindexAdded) {
        this.prevHighlightTarget.removeAttribute('tabindex');
        this.prevTabindexAdded = false;
      }
      this.prevHighlightTarget = null;
    }

    if (this.prevSubscription) {
      this.prevSubscription.unsubscribe();
      this.prevSubscription = null;
    }

    if (this.listenerAbortController) {
      this.listenerAbortController.abort();
      this.listenerAbortController = null;
    }

    this.cancelPendingTimeout();
    this.cancelLateFocus();
  }
}

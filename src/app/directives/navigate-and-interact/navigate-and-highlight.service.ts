import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { Subscription, filter, timer } from 'rxjs';
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
// helped them locate it. Frozen with `as const` so future code can't mutate
// the dismiss set at runtime.
const dismissKeys: ReadonlySet<string> = new Set(['Escape', 'Tab'] as const);

export interface WaitForElementOptions {
  block?: ScrollLogicalPosition;
  /**
   * When true, draws the highlight outline inset (negative outline-offset)
   * so it isn't clipped by the viewport edge or an overflow container.
   *
   * Caveat: `<tr>` rows are special-cased in `_material-reduction.scss` and
   * always render an outset pulse regardless of this flag — outlines on
   * table rows interact poorly with `border-collapse`. If a future caller
   * sets `inset: true` on a row and expects an inset outline, update the
   * CSS (or move the decision into this service) before relying on it.
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
  // Tracks whether the non-menu `focusTarget` branch added a synthetic
  // `tabindex="-1"` to a non-natively-focusable host (so cleanup knows
  // whether to remove it). The mat-menu branch never adds a tabindex, so it
  // explicitly leaves this `false` — see `focusTarget` for the contract.
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

  constructor() {
    // Cancel any pending poll on route changes the user (or any other code
    // path) initiates. Otherwise a poll started for page A can resolve on
    // page B and highlight whatever element happens to share the id.
    // navigateAndHighlight's own navigations are safe: they bump the token
    // BEFORE calling router.navigate(), so the NavigationStart fires while
    // pendingTimeoutId is still null — the cancel is a no-op for them, and
    // polling kicks off later from the router promise's `.then()`.
    //
    // Optional chain: many existing tests `mockProvider(Router, { navigate })`
    // without supplying `events`. The real router always has it; treating a
    // missing `events` as a no-op keeps those tests working without forcing
    // every consumer's spec to grow a Subject for the events stream.
    this.router.events?.pipe(
      filter((event): event is NavigationStart => event instanceof NavigationStart),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.cancelPendingTimeout());
  }

  navigateAndHighlight(route: string[], hash?: string, options?: WaitForElementOptions): void {
    this.cancelPendingTimeout();
    const token = ++this.currentNavigationToken;

    this.router.navigate(route, { fragment: hash }).then(() => {
      if (token !== this.currentNavigationToken || !hash) {
        return;
      }

      this.pollForElement(hash, 0, options, token);
    });
  }

  /**
   * Polls for an element by id and highlights + focuses it once it is in the
   * DOM AND laid out (non-zero size). Waits up to 5s. A new call cancels the
   * previous in-flight poll so only the most recent target is highlighted.
   */
  waitForElement(hash: string, options?: WaitForElementOptions): void {
    this.cancelPendingTimeout();
    const token = ++this.currentNavigationToken;
    this.pollForElement(hash, 0, options, token);
  }

  /**
   * Highlight an already-resolved DOM element, skipping the poll. Use when the
   * caller has independently verified the element is in the DOM and visible
   * (e.g. UiSearchDirectivesService's directive-level visibility check) — this
   * avoids re-polling for an element we already have.
   */
  highlightResolved(target: HTMLElement, options?: WaitForElementOptions): void {
    this.cancelPendingTimeout();
    // The bump is symmetric with `navigateAndHighlight` / `waitForElement`
    // even though there's no async path inside this method to thread the
    // token through — keep it that way so adding an async step later (e.g.
    // awaiting an animation) doesn't silently break the cancellation
    // contract documented on `currentNavigationToken`.
    this.currentNavigationToken++;
    // Defensive guard: the contract is that the caller has already verified
    // visibility, but a future caller passing a detached node would otherwise
    // get a silent no-op highlight with the 4-second timer running on a node
    // that isn't on screen.
    if (!target.isConnected) return;
    this.scrollIntoView(target, options);
  }

  /**
   * Public cancellation entry. Bumps the navigation token and clears any
   * pending poll timeout without starting new work — used by other services
   * (e.g. UiSearchDirectivesService.requestHighlight) so a fresh selection
   * can pre-empt an in-flight poll initiated elsewhere before scheduling its
   * own. Does NOT tear down an already-painted highlight; the next
   * `highlightResolved`/`waitForElement` call will do that via
   * `cleanupPreviousHighlight`.
   */
  cancelPendingHighlight(): void {
    this.cancelPendingTimeout();
    this.currentNavigationToken++;
  }

  private pollForElement(
    hash: string,
    attemptCount: number,
    options: WaitForElementOptions | undefined,
    token: number,
  ): void {
    // Bail if a newer public entry has bumped the token while we were waiting
    // for the next iteration. Mirrors the cancellation contract that
    // `cancelPendingTimeout` already enforces for in-flight setTimeout
    // callbacks; the token check covers the (theoretical) gap where the
    // callback has been dequeued but the recursive call hasn't yet returned.
    if (token !== this.currentNavigationToken) {
      this.pendingTimeoutId = null;
      return;
    }

    const htmlElement = this.window.document.getElementById(hash);

    if (htmlElement) {
      this.pendingTimeoutId = null;
      this.scrollIntoView(htmlElement, options);
    } else if (attemptCount < elementMaxPollAttempts) {
      this.pendingTimeoutId = setTimeout(() => {
        this.pollForElement(hash, attemptCount + 1, options, token);
      }, elementPollIntervalMs);
    } else {
      this.pendingTimeoutId = null;
    }
  }

  scrollIntoView(htmlElement: HTMLElement, options?: WaitForElementOptions): void {
    htmlElement.scrollIntoView({ block: options?.block ?? 'center' });
    this.highlight(htmlElement, options);
  }

  highlight(targetElement: HTMLElement, options?: WaitForElementOptions): void {
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

    // Single document-level capture-phase listener covers both "click on the
    // target" (signals the user has acted on the highlight) and "click
    // outside" (user has moved on). One listener avoids double-firing
    // cleanupPreviousHighlight, which matters if cleanup ever grows
    // side-effecting work (analytics, dispatch).
    this.window.document.addEventListener(
      'click',
      () => this.cleanupPreviousHighlight(),
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
        // TODO: Revisit when @angular/cdk drops keyCode in favour of `key`
        // (tracked >=22.x). Once CDK reads `event.key`, the keyCode/which
        // patches below can be removed.
        const event = new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(event, 'keyCode', { value: 40 }); // DOWN_ARROW
        Object.defineProperty(event, 'which', { value: 40 });
        menuPanel.dispatchEvent(event);
      }
      // Sanity check: if Material renamed the menu classes, re-ordered items,
      // or the keymanager stopped honouring synthetic events, the loop above
      // can leave focus on the wrong row. Force focus to `target` so the
      // user at least lands on the searched-for item even when the
      // keymanager is out of sync.
      if (this.window.document.activeElement !== target) {
        target.focus({ preventScroll: true });
      }
      // The menu path never injects a tabindex (mat-menu items are already
      // focusable). Make the contract explicit so cleanup is a no-op.
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

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

// `tn-menu` renders its overlay panel as `<div class="tn-menu" cdkMenu>` holding
// `<button class="tn-menu-item" cdkMenuItem>` rows. These are internal
// @truenas/ui-components class names rather than a public API, so they are pinned
// here instead of being spread across the file.
// TEMP: replace once the library exposes a stable hook for its menu panel/items
// (tracked under Epic NAS-141021 as a library follow-up).
const tnMenuPanelSelector = '.tn-menu';
const tnMenuItemClass = 'tn-menu-item';

export interface WaitForElementOptions {
  block?: ScrollLogicalPosition;
  /**
   * Draws the outline inset so the viewport or an overflow container doesn't clip it. `<tr>` rows
   * always get an outset pulse from `_globals.scss`, since outlines fight `border-collapse`.
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
  // whether to remove it). The menu branch never adds a tabindex, so it
  // explicitly leaves this `false` — see `focusTarget` for the contract.
  private prevTabindexAdded = false;
  private prevSubscription: Subscription | null = null;
  private listenerAbortController: AbortController | null = null;
  private pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private lateFocusTimeoutId: ReturnType<typeof setTimeout> | null = null;
  // Bumped once per public entry (navigateAndHighlight / waitForElement / highlightResolved), so a
  // stale router resolution bails instead of polling for the previous target, and direct callers
  // cancel an in-flight navigation. Internal callers must use the private path to avoid re-bumping.
  private currentNavigationToken = 0;

  constructor() {
    // Cancel a pending poll on any route change, or a poll started on page A can highlight a
    // same-id element on page B. Our own navigations bump the token before `router.navigate()`,
    // so the cancel is a no-op for them. `events?.` because many specs mock Router without it.
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
   * Bumps the navigation token and clears a pending poll without starting new work, so another
   * service (e.g. UiSearchDirectivesService) can pre-empt an in-flight poll. An already-painted
   * highlight stays until the next `highlightResolved`/`waitForElement` cleans it up.
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
        // Inside a menu, the browser's default Enter→click can miss the focused row in some key
        // manager states, so Enter is captured and the focused item clicked explicitly. Outside menus
        // the native handling must stay, or Enter would double-fire. Verified against @angular/cdk 21.x.
        if (event.key === 'Enter') {
          const targetMenuPanel = targetElement.closest(tnMenuPanelSelector);
          if (targetMenuPanel) {
            const focused = this.window.document.activeElement;
            const focusedIsInSameMenu = focused instanceof HTMLElement
              && targetMenuPanel.contains(focused)
              && focused.classList.contains(tnMenuItemClass);
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
    // CdkMenu's FocusKeyManager tracks `_activeItem` apart from DOM focus, so focusing `target`
    // directly would leave arrows and Enter acting on the first item. Synthetic ArrowDowns on the
    // panel (which holds CdkMenu's keydown listener) walk both focus and the manager to the target.
    // Verified against @angular/cdk 21.x.
    const menuPanel = target.closest<HTMLElement>(tnMenuPanelSelector);
    if (menuPanel) {
      const items = Array.from(menuPanel.querySelectorAll<HTMLElement>(`.${tnMenuItemClass}`));
      const targetIndex = items.indexOf(target);
      for (let i = 0; i < targetIndex; i++) {
        // CDK's FocusKeyManager still reads the deprecated `keyCode`, which the KeyboardEvent
        // constructor ignores, so it's patched on afterwards or the manager ignores the event.
        // TODO: drop the keyCode/which patches once @angular/cdk reads `event.key` (>=22.x).
        const event = new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(event, 'keyCode', { value: 40 }); // DOWN_ARROW
        Object.defineProperty(event, 'which', { value: 40 });
        menuPanel.dispatchEvent(event);
      }
      // Sanity check: if the library renamed the menu classes, re-ordered items,
      // or the keymanager stopped honouring synthetic events, the loop above
      // can leave focus on the wrong row. Force focus to `target` so the
      // user at least lands on the searched-for item even when the
      // keymanager is out of sync.
      if (this.window.document.activeElement !== target) {
        target.focus({ preventScroll: true });
      }
      // The menu path never injects a tabindex (menu items are already
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

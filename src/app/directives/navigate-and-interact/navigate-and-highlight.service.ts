import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { FocusService } from 'app/services/focus.service';

export const highlightTargetClass = 'ix-highlight-target';
export const highlightTargetInsetClass = 'ix-highlight-target-inset';

const pollIntervalMs = 100;
const maxPollAttempts = 50;
const highlightDurationMs = 4000;
const lateFocusDelayMs = 350;

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

  navigateAndHighlight(route: string[], hash?: string, options?: WaitForElementOptions): void {
    // Cancel any pending poll up front so it can't briefly highlight a stale
    // target during the upcoming router transition.
    this.cancelPendingTimeout();

    this.router.navigate(route, { fragment: hash }).then(() => {
      if (!hash) {
        return;
      }

      this.waitForElement(hash, options);
    });
  }

  /**
   * Polls for an element by id and highlights + focuses it once it is in the
   * DOM AND laid out (non-zero size). Waits up to 5s. A new call cancels the
   * previous in-flight poll so only the most recent target is highlighted.
   */
  waitForElement(hash: string, options?: WaitForElementOptions): void {
    this.cancelPendingTimeout();
    this.pollForElement(hash, 0, options);
  }

  private pollForElement(hash: string, attemptCount: number, options?: WaitForElementOptions): void {
    const htmlElement = this.window.document.getElementById(hash);

    if (htmlElement) {
      this.pendingTimeoutId = null;
      this.scrollIntoView(htmlElement, options);
    } else if (attemptCount < maxPollAttempts) {
      this.pendingTimeoutId = setTimeout(() => {
        this.pollForElement(hash, attemptCount + 1, options);
      }, pollIntervalMs);
    } else {
      this.pendingTimeoutId = null;
    }
  }

  scrollIntoView(htmlElement: HTMLElement, options?: WaitForElementOptions): void {
    htmlElement.scrollIntoView({ block: options?.block ?? 'center' });
    this.highlight(htmlElement, options?.inset);
  }

  highlight(targetElement: HTMLElement, inset = false): void {
    if (!targetElement) return;

    this.cleanupPreviousHighlight();

    const className = inset ? highlightTargetInsetClass : highlightTargetClass;
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
      () => this.cleanupPreviousHighlight(),
      { capture: true, signal },
    );
  }

  private focusTarget(target: HTMLElement): void {
    this.prevTabindexAdded = this.focusService.focusWithFallback(target, { preventScroll: true });

    // mat-menu, cdk overlays, and slide-ins auto-focus their own first item
    // after open animations finish (~250-300ms). Reclaim focus once that has
    // settled so the user lands on the searched-for item.
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

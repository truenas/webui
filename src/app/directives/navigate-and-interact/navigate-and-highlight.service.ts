import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';

export interface WaitForElementOptions {
  block?: ScrollLogicalPosition;
  /**
   * When true, draws the highlight outline inset (negative outline-offset)
   * so it isn't clipped by the viewport edge or an overflow container.
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

  private prevHighlightTarget: HTMLElement | null = null;
  private prevSubscription: Subscription | null = null;
  private clickOutsideListener: ((event: MouseEvent) => void) | null = null;
  private pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;

  navigateAndHighlight(route: string[], hash?: string): void {
    // Cancel any pending poll up front so it can't briefly highlight a stale
    // target during the upcoming router transition.
    this.cancelPendingTimeout();

    this.router.navigate(route, { fragment: hash }).then(() => {
      if (!hash) {
        return;
      }

      // Wait for element with retries (for loading states)
      this.waitForElement(hash);
    });
  }

  /**
   * Polls for an element by id and highlights it when found.
   * Retries up to 50 times at 100ms intervals (5 seconds total).
   * Cancels any in-flight poll started by a previous call so only the
   * most recent target is highlighted.
   */
  waitForElement(hash: string, options?: WaitForElementOptions): void {
    this.cancelPendingTimeout();
    this.pollForElement(hash, 0, options);
  }

  private pollForElement(hash: string, attemptCount: number, options?: WaitForElementOptions): void {
    const maxAttempts = 50; // 5 seconds total (50 * 100ms)
    const htmlElement = this.window.document.getElementById(hash);

    if (htmlElement) {
      this.pendingTimeoutId = null;
      this.scrollIntoView(htmlElement, options);
    } else if (attemptCount < maxAttempts) {
      this.pendingTimeoutId = setTimeout(() => {
        this.pollForElement(hash, attemptCount + 1, options);
      }, 100);
    } else {
      this.pendingTimeoutId = null;
    }
  }

  private cancelPendingTimeout(): void {
    if (this.pendingTimeoutId !== null) {
      clearTimeout(this.pendingTimeoutId);
      this.pendingTimeoutId = null;
    }
  }

  scrollIntoView(htmlElement: HTMLElement, options?: WaitForElementOptions): void {
    htmlElement.scrollIntoView({ block: options?.block ?? 'center' });
    this.highlight(htmlElement, { inset: options?.inset });
  }

  highlight(targetElement: HTMLElement, options?: WaitForElementOptions): void {
    if (!targetElement) return;

    this.cleanupPreviousHighlight();

    targetElement.style.outline = '2px solid var(--primary)';
    targetElement.style.outlineOffset = options?.inset ? '-2px' : '2px';
    this.prevHighlightTarget = targetElement;

    this.prevSubscription = timer(2150).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.cleanupPreviousHighlight();
    });

    targetElement.addEventListener(
      'click',
      () => {
        this.cleanupPreviousHighlight();
      },
      { once: true },
    );

    this.addClickOutsideListener(targetElement);
  }

  private addClickOutsideListener(targetElement: HTMLElement): void {
    this.clickOutsideListener = (event: MouseEvent) => {
      if (!targetElement.contains(event.target as Node)) {
        this.cleanupPreviousHighlight();
      }
    };

    this.window.document.addEventListener('click', this.clickOutsideListener, true);
  }

  private cleanupPreviousHighlight(): void {
    if (this.prevHighlightTarget) {
      this.prevHighlightTarget.style.outline = '';
      this.prevHighlightTarget.style.outlineOffset = '';
      this.prevHighlightTarget = null;
    }

    if (this.prevSubscription) {
      this.prevSubscription.unsubscribe();
      this.prevSubscription = null;
    }

    if (this.clickOutsideListener) {
      this.window.document.removeEventListener('click', this.clickOutsideListener, true);
      this.clickOutsideListener = null;
    }

    this.cancelPendingTimeout();
  }
}

import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';

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
    // Cancel any pending timeout from previous navigation
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
   */
  waitForElement(hash: string, attemptCount = 0): void {
    const maxAttempts = 50; // 5 seconds total (50 * 100ms)
    const htmlElement = this.window.document.getElementById(hash);

    if (htmlElement) {
      this.pendingTimeoutId = null;
      this.scrollIntoView(htmlElement);
    } else if (attemptCount < maxAttempts) {
      this.pendingTimeoutId = setTimeout(() => {
        this.waitForElement(hash, attemptCount + 1);
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

  scrollIntoView(htmlElement: HTMLElement): void {
    htmlElement.scrollIntoView({ block: 'center' });
    this.highlight(htmlElement);
  }

  highlight(targetElement: HTMLElement): void {
    if (!targetElement) return;

    this.cleanupPreviousHighlight();

    targetElement.style.outline = '2px solid var(--primary)';
    targetElement.style.outlineOffset = '2px';
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

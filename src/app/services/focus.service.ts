import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FocusService {
  constructor(
    @Inject(DOCUMENT) private document: Document,
  ) {}

    private lastFocusedElement: HTMLElement | null = null;

    captureCurrentFocus(): void {
      this.lastFocusedElement = this.document.activeElement as HTMLElement;
    }

    restoreFocus(): void {
      if (this.lastFocusedElement) {
        setTimeout(() => {
          const dataTestValue = this.lastFocusedElement?.getAttribute('data-test');
          const overlayBackdrop = this.document.querySelector('.cdk-overlay-backdrop');

          if (dataTestValue && !overlayBackdrop) {
            const dataTestElement = this.document.querySelector(`[data-test="${dataTestValue}"]`);
            (dataTestElement as HTMLElement)?.focus();
          } else {
            this.lastFocusedElement?.focus();
          }

          this.lastFocusedElement = null;
        }, 200);
      }
    }

    focusElementById(id: string): void {
      this.document.getElementById(id)?.focus();
    }

    focusFirstFocusableElement(element: HTMLElement): void {
      if (!element) return;

      const focusableSelectors = [
        'a[href]', 'area[href]', 'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])', 'textarea:not([disabled])',
        'button:not([disabled])', 'iframe', 'object', 'embed',
        '[contenteditable]', '[tabindex]:not([tabindex="-1"])',
      ];
      const focusableElements = element.querySelectorAll(focusableSelectors.join(', '));
      if (focusableElements.length > 0) {
        const firstFocusable = focusableElements[0] as HTMLElement;
        firstFocusable.focus();
      }
    }
}

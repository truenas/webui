import { Injectable, DOCUMENT, inject } from '@angular/core';

export const focusableSelectors = [
  'a[href]', 'area[href]', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])',
  'button:not([disabled])', 'iframe', 'object', 'embed',
  '[contenteditable]', '[tabindex]:not([tabindex="-1"])',
] as const;

const focusableSelectorString = focusableSelectors.join(', ');

@Injectable({
  providedIn: 'root',
})
export class FocusService {
  private document = inject<Document>(DOCUMENT);

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

  focusFirstFocusableElement(element: HTMLElement | null): void {
    if (!element) return;

    const focusableElements = this.getFocusableElements(element);
    if (this.getFocusableElements(element).length > 0) {
      const firstFocusable = focusableElements[0];
      firstFocusable.focus();
    }
  }

  getFocusableElements(wrapper: HTMLElement): HTMLElement[] {
    const elements = wrapper.querySelectorAll(focusableSelectorString);
    return Array.from(elements) as HTMLElement[];
  }

  isFocusable(element: HTMLElement): boolean {
    if (element.matches(':disabled')) return false;
    return element.matches(focusableSelectorString);
  }

  /**
   * Focuses an element, adding tabindex=-1 first when it isn't natively
   * focusable. Returns true if a tabindex was added so the caller can clean
   * up after the focus is no longer needed.
   */
  focusWithFallback(element: HTMLElement, options?: FocusOptions): boolean {
    const needsTabindex = !this.isFocusable(element);
    if (needsTabindex) {
      element.setAttribute('tabindex', '-1');
    }
    element.focus(options);
    return needsTabindex;
  }
}

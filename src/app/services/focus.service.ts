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
          const dataTestValue = this.lastFocusedElement.getAttribute('data-test');
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
}

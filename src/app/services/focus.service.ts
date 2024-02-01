import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FocusService {
  constructor(
    @Inject(DOCUMENT) private document: Document,
  ) {}

    private lastFocusedItem: HTMLElement | null = null;

    get lastFocusedElement(): HTMLElement | null {
      return this.lastFocusedItem;
    }

    setLastFocusedElement(element: HTMLElement | null): void {
      this.lastFocusedItem = element;
    }

    captureCurrentFocus(): void {
      this.lastFocusedItem = this.document.activeElement as HTMLElement;
    }

    restoreFocus(): void {
      if (this.lastFocusedElement) {
        this.lastFocusedElement.focus();
        this.lastFocusedItem = null;
      }
    }

    focusElementById(id: string): void {
      this.document.getElementById(id)?.focus();
    }
}

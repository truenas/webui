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
        this.lastFocusedElement.focus();
        this.lastFocusedElement = null;
      }
    }

    focusElementById(id: string): void {
      this.document.getElementById(id)?.focus();
    }
}

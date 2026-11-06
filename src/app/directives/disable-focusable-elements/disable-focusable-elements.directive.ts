import {
  DestroyRef, Directive, ElementRef, OnChanges, Renderer2, input, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take, timer } from 'rxjs';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';

@Directive({
  selector: '[disableFocusableElements]',
})
export class DisableFocusableElementsDirective implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private renderer = inject(Renderer2);

  readonly disableFocusableElements = input.required<boolean>();

  /**
   * A selector for descendants that stay reachable while the region is disabled. Empty by default.
   *
   * The region loses the keyboard because the user is not meant to *operate* it. A control that
   * only explains it — a tooltip trigger — is the exception: a locked feature whose help text
   * cannot be opened is the one thing the region is being left on screen for.
   */
  readonly keepFocusable = input('');

  /** Live only while the region is disabled — see `watchForLateContent`. */
  private observer: MutationObserver | undefined;

  constructor() {
    // Registered once here rather than per watch, which would stack a callback per input change.
    this.destroyRef.onDestroy(() => this.stopWatching());
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    // `keepFocusable` too: a caller binding a computed exemption would otherwise keep whatever the
    // previous value swept until the disabled flag happened to flip.
    if (changes.disableFocusableElements || changes.keepFocusable) {
      this.updateFocusableElements();
    }
  }

  private updateFocusableElements(): void {
    const disabled = this.disableFocusableElements();

    this.stopWatching();
    if (disabled) {
      this.watchForLateContent();
    }

    timer(0).pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateTabIndex(disabled ? -1 : 0);
    });
  }

  /**
   * Re-sweeps content rendered after the first pass, so a control revealed later doesn't keep its
   * tab stop in a disabled region. Only while disabled: the enabled sweep strips `disabled`, which
   * would undo other code's disabling. Only childList, because the sweep writes attributes itself.
   * Batches that added no element are skipped, since `*ixHasAccess` gives every caller this observer.
   */
  private watchForLateContent(): void {
    if (typeof MutationObserver === 'undefined') {
      return;
    }
    // The callback only writes attributes, so it never needs change detection.
    this.observer = new MutationObserver((records) => {
      const addedElement = records.some((record) => {
        return Array.from(record.addedNodes).some((node) => node.nodeType === Node.ELEMENT_NODE);
      });
      if (addedElement) {
        this.updateTabIndex(-1);
      }
    });
    this.observer.observe(this.elementRef.nativeElement, { childList: true, subtree: true });
  }

  private stopWatching(): void {
    this.observer?.disconnect();
    this.observer = undefined;
  }

  private updateTabIndex(tabIndex: number): void {
    const exempt = this.keepFocusable();
    const focusableElements = this.getFocusableElements();
    focusableElements.forEach((element) => {
      // `closest` rather than `matches`: an exempt host counts for whatever it renders inside.
      if (exempt && element.closest(exempt)) {
        return;
      }
      this.renderer.setAttribute(element, 'tabindex', tabIndex.toString());
      this.updateDisabledAttribute(element, tabIndex);
    });
  }

  private getFocusableElements(): NodeListOf<HTMLElement> {
    return this.elementRef.nativeElement.querySelectorAll(
      'a, button:not([disabled]), input, textarea, select, [tabindex]',
    );
  }

  private updateDisabledAttribute(element: HTMLElement, tabIndex: number): void {
    if (tabIndex === -1) {
      this.renderer.setAttribute(element, 'disabled', 'true');
    } else {
      this.renderer.removeAttribute(element, 'disabled');
    }
  }
}

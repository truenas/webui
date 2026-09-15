import {
  DestroyRef, Directive, ElementRef, NgZone, OnChanges, Renderer2, input, inject,
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
  private zone = inject(NgZone);

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
   * Re-sweeps whatever the region renders after the first pass.
   *
   * The sweep below is a one-off walk of the DOM as it stands, so a control revealed later — a
   * section expanded, a field a sibling's value brings into view — would keep its place in the tab
   * order inside a region the user is not meant to operate.
   *
   * Only while disabled, and childList only, both on purpose. The enabled direction writes
   * `tabindex="0"` and removes `disabled`, so running it on every DOM change would strip the
   * attribute off controls something else disabled for its own reasons — `getFocusableElements`
   * skips `button[disabled]`, but not a disabled input, textarea or select. Attribute mutations
   * are not watched because the sweep writes attributes itself, which would set it running
   * against its own output.
   *
   * The callback filters to batches that actually added an element. Every existing caller gets
   * this observer too — `*ixHasAccess` binds a constant `true` — and a batch that only removed
   * nodes or changed text has nothing new to take out of the tab order.
   */
  private watchForLateContent(): void {
    if (typeof MutationObserver === 'undefined') {
      return;
    }
    // Nothing here needs change detection: the callback only writes attributes.
    this.zone.runOutsideAngular(() => {
      this.observer = new MutationObserver((records) => {
        const addedElement = records.some((record) => {
          return Array.from(record.addedNodes).some((node) => node.nodeType === Node.ELEMENT_NODE);
        });
        if (addedElement) {
          this.updateTabIndex(-1);
        }
      });
      this.observer.observe(this.elementRef.nativeElement, { childList: true, subtree: true });
    });
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

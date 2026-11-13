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
   * Re-sweeps when content is rendered after the first pass, or when a control's own `[disabled]`
   * binding turns false: the sweep skips buttons that are already disabled, so without this a
   * button enabled after it stays usable in a locked region. Only while disabled: the enabled sweep
   * strips `disabled`, which would undo other code's disabling. Only removals of `disabled` count,
   * so the sweep's own writes never trigger it again.
   */
  private watchForLateContent(): void {
    if (typeof MutationObserver === 'undefined') {
      return;
    }
    // The callback only writes attributes, so it never needs change detection.
    this.observer = new MutationObserver((records) => {
      if (records.some((record) => this.needsSweep(record))) {
        this.updateTabIndex(-1);
      }
    });
    this.observer.observe(this.elementRef.nativeElement, {
      childList: true,
      subtree: true,
      attributeFilter: ['disabled'],
    });
  }

  private needsSweep(record: MutationRecord): boolean {
    if (record.type === 'attributes') {
      return !(record.target as Element).hasAttribute('disabled');
    }
    return Array.from(record.addedNodes).some((node) => node.nodeType === Node.ELEMENT_NODE);
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

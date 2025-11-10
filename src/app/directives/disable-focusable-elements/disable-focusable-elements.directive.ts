import { DestroyRef, Directive, ElementRef, OnChanges, Renderer2, input, inject } from '@angular/core';
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

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.disableFocusableElements) {
      this.updateFocusableElements();
    }
  }

  private updateFocusableElements(): void {
    timer(0).pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const tabIndex = this.disableFocusableElements() ? -1 : 0;
      this.updateTabIndex(tabIndex);
    });
  }

  private updateTabIndex(tabIndex: number): void {
    const focusableElements = this.getFocusableElements();
    focusableElements.forEach((element) => {
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

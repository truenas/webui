import {
  Directive, Renderer2, ElementRef, OnChanges, input,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { take, timer } from 'rxjs';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';

@UntilDestroy()
@Directive({
  selector: '[disableFocusableElements]',
  standalone: true,
})
export class DisableFocusableElementsDirective implements OnChanges {
  readonly disableFocusableElements = input.required<boolean>();

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.disableFocusableElements) {
      this.updateFocusableElements();
    }
  }

  private updateFocusableElements(): void {
    timer(0).pipe(take(1), untilDestroyed(this)).subscribe(() => {
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

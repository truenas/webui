import {
  Directive, Input, Renderer2, ElementRef, OnChanges,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { take, timer } from 'rxjs';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';

@UntilDestroy()
@Directive({
  selector: '[disableFocusableElements]',
})
export class DisableFocusableElementsDirective implements OnChanges {
  @Input() disableFocusableElements: boolean;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.disableFocusableElements) {
      timer(0).pipe(take(1), untilDestroyed(this)).subscribe(() => {
        if (this.disableFocusableElements) {
          this.updateElementTabIndexProperty(-1);
        } else {
          this.updateElementTabIndexProperty(0);
        }
      });
    }
  }

  private updateElementTabIndexProperty(tabIndex: number): void {
    const focusableElements = this.elementRef.nativeElement.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]',
    );

    focusableElements.forEach((element: HTMLElement) => {
      this.renderer.setAttribute(element, 'tabindex', tabIndex.toString());

      if (tabIndex === -1) {
        this.renderer.setAttribute(element, 'disabled', 'true');
      } else if (element.closest('.role-missing') === null) {
        this.renderer.removeAttribute(element, 'disabled');
      }
    });
  }
}

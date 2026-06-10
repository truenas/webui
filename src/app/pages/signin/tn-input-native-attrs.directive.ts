import {
  AfterViewInit, Directive, ElementRef, inject, input,
} from '@angular/core';

/**
 * TEMP: until @truenas/ui-components ships native-attribute passthrough on
 * tn-input (`autocomplete`, `name`, `readonly`) and a `testId` input on its
 * suffix-action button, this directive writes them onto the rendered elements
 * directly. Remove once the library catches up.
 */
@Directive({
  selector: 'tn-input[ixNativeAttrs]',
  standalone: true,
})
export class TnInputNativeAttrsDirective implements AfterViewInit {
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly ixNativeAttrs = input.required<Record<string, string>>();
  readonly ixSuffixActionTestId = input<string | undefined>(undefined);

  ngAfterViewInit(): void {
    const nativeInput = this.elementRef.nativeElement.querySelector('input, textarea');
    Object.entries(this.ixNativeAttrs()).forEach(([name, value]) => {
      nativeInput?.setAttribute(name, value);
    });

    const suffixActionTestId = this.ixSuffixActionTestId();
    if (suffixActionTestId) {
      this.elementRef.nativeElement
        .querySelector('.tn-input__suffix-action')
        ?.setAttribute('data-test', suffixActionTestId);
    }
  }
}

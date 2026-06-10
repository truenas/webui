import {
  Directive, ElementRef, afterRenderEffect, inject, input,
} from '@angular/core';
import { TN_TEST_ATTR } from '@truenas/ui-components';

/**
 * TEMP: until @truenas/ui-components ships native-attribute passthrough on
 * tn-input (`autocomplete`, `name`, `readonly`, `aria-required`) and a `testId`
 * input on its suffix-action button, this directive writes them onto the
 * rendered elements directly. Remove once the library catches up.
 */
@Directive({
  selector: 'tn-input[ixNativeAttrs]',
})
export class TnInputNativeAttrsDirective {
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private testAttr = inject(TN_TEST_ATTR);

  readonly ixNativeAttrs = input.required<Record<string, string>>();
  readonly ixSuffixActionTestId = input<string | undefined>(undefined);

  constructor() {
    afterRenderEffect(() => {
      const nativeInput = this.elementRef.nativeElement.querySelector('input, textarea');
      Object.entries(this.ixNativeAttrs()).forEach(([name, value]) => {
        nativeInput?.setAttribute(name, value);
      });

      const suffixActionTestId = this.ixSuffixActionTestId();
      if (suffixActionTestId) {
        this.elementRef.nativeElement
          .querySelector('.tn-input__suffix-action')
          ?.setAttribute(this.testAttr, suffixActionTestId);
      }
    });
  }
}

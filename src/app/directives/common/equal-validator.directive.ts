import { Directive, Attribute } from '@angular/core';
import {
  Validator, AbstractControl, NG_VALIDATORS, ValidationErrors,
} from '@angular/forms';

@Directive({
  selector: '[appEqualValidator][ngModel]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: EqualValidatorDirective, multi: true },
  ],
})
export class EqualValidatorDirective implements Validator {
  constructor(@Attribute('appEqualValidator') public validateEqual: string,
    @Attribute('reverse') public reverse: string) { }

  private get isReverse(): boolean {
    if (!this.reverse) return false;
    return this.reverse === 'true';
  }

  validate(currentControl: AbstractControl): ValidationErrors {
    // self value
    const currentControlValue = currentControl.value;

    // control value
    const anotherControl = currentControl.root.get(this.validateEqual);
    const anotherControlValue = anotherControl ? anotherControl.value : null;

    // value not equal
    if (anotherControl && currentControlValue !== anotherControlValue && !this.isReverse) {
      return {
        validateEqual: true,
      };
    }

    // value equal and reverse
    if (anotherControl && currentControlValue === anotherControlValue && this.isReverse) {
      delete anotherControl['errors']['validateEqual'];
      if (!Object.keys(anotherControl['errors']).length) anotherControl.setErrors(null);
    }

    // value not equal and reverse
    if (anotherControl && currentControlValue !== anotherControlValue && this.isReverse) {
      anotherControl.setErrors({ validateEqual: true });
    }

    return null;
  }
}

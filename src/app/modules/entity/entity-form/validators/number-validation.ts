import { ValidatorFn, UntypedFormControl, ValidationErrors } from '@angular/forms';

export function numberValidator(): ValidatorFn {
  return (control: UntypedFormControl): ValidationErrors => {
    if (control.value === '' || control.value === undefined) {
      return null;
    }

    if (!/^\d+$/.test(control.value)) {
      return { number: true };
    }

    return null;
  };
}

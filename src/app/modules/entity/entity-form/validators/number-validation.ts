import { ValidatorFn, FormControl, ValidationErrors } from '@angular/forms';

export function numberValidator(): ValidatorFn {
  return (control: FormControl): ValidationErrors => {
    if (control.value === '' || control.value === undefined) {
      return null;
    }

    if (!/^\d+$/.test(control.value)) {
      return { number: true };
    }

    return null;
  };
}

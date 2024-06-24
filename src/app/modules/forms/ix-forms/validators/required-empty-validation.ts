import { ValidatorFn, UntypedFormControl } from '@angular/forms';

export function requiredEmpty(): ValidatorFn {
  return (control: UntypedFormControl) => {
    if (control.value) {
      return { requiredEmpty: true };
    }

    return null;
  };
}

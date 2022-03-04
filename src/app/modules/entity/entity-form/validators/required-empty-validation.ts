import { ValidatorFn, FormControl } from '@angular/forms';

export function requiredEmpty(): ValidatorFn {
  return (control: FormControl) => {
    if (control.value) {
      return { requiredEmpty: true };
    }

    return null;
  };
}

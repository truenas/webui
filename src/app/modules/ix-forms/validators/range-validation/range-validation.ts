import { ValidatorFn, FormControl } from '@angular/forms';

export function rangeValidator(min: number, max?: number): ValidatorFn {
  return function rangeValidate(control: FormControl<string>) {
    let regex;
    if (min === 0) {
      regex = /^(0|[1-9]\d*)$/;
    } else {
      regex = /^[1-9]\d*$/;
    }

    if (!control.value) {
      return null;
    }

    if (regex.test(control.value)) {
      const num = Number(control.value);
      if (num >= min) {
        if (max) {
          if (num <= max) {
            return null;
          }
        } else {
          return null;
        }
      }
    }

    return { range: true, rangeValue: { min, max } };
  };
}

export function portRangeValidator(): ValidatorFn {
  return rangeValidator(1, 65535);
}

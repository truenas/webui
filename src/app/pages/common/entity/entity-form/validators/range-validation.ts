import { AbstractControl } from '@angular/forms';
import { FormControl, FormGroup } from '@angular/forms'

export function rangeValidator(min: number, max?: number) {

  let thisControl: FormControl;

  return function rangeValidate(control: FormControl) {
    let regex;
    if (min === 0) {
      regex = /^(0|[1-9]\d*)$/
    } else {
      regex = /^[1-9]\d*$/
    }

    if (!control.parent) {
      return null;
    }

    // Initializing the validator.
    if (!thisControl) {
      thisControl = control;
    }

    if (!thisControl.value) {
      return null;
    }

    if (regex.test(thisControl.value)) {
      const num = Number(thisControl.value);
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

    return {range: true, rangeValue:{min: min, max: max}};
  }
}
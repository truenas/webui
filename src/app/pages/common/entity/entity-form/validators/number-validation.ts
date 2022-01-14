import { ValidatorFn, FormControl } from '@angular/forms';

export function numberValidator(): ValidatorFn {
  let thisControl: FormControl;

  return function numberValidate(control: FormControl) {
    if (!control.parent) {
      return null;
    }

    // Initializing the validator.
    if (!thisControl) {
      thisControl = control;
    }

    if (thisControl.value == '' || thisControl.value == undefined) {
      return null;
    }

    if (!/^\d+$/.test(thisControl.value)) {
      return { number: true };
    }

    return null;
  };
}

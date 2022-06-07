import { ValidatorFn, FormControl } from '@angular/forms';

export function regexValidator(regexString: RegExp): ValidatorFn {
  let thisControl: FormControl;

  return function regexValidate(control: FormControl) {
    if (!control.parent) {
      return null;
    }

    // Initializing the validator.
    if (!thisControl) {
      thisControl = control;
    }

    if (thisControl.value === '' || thisControl.value === undefined) {
      return null;
    }

    if (!regexString.test(thisControl.value)) {
      return { regex: true };
    }

    return null;
  };
}

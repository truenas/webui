import { AbstractControl } from '@angular/forms';
import { FormControl, FormGroup } from '@angular/forms'

export function regexValidator(regexString: RegExp) {

  let thisControl: FormControl;

  return function regexValidate(control: FormControl) {

    if (!control.parent) {
      return null;
    }

    // Initializing the validator.
    if (!thisControl) {
      thisControl = control;
    }

    if(thisControl.value == "" || thisControl.value == undefined) {
      return null;
    }

    if (!regexString.test(thisControl.value)) {
      return {regex : true};
    }

    return null;
  }
}
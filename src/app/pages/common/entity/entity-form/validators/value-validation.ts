import {FormControl} from '@angular/forms'

export function ValueValidator() {

  let thisControl: FormControl;

  return function validValue(control: FormControl) {

    if (!thisControl) {
      thisControl = control;
    }

    if (!thisControl.hasError) {
      return { validValue : true };
    }

    return null;
  }
}

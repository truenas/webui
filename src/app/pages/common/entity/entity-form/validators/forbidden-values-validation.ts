import { FormControl } from '@angular/forms'

export function forbiddenValues(arrayOfValues: any) {

  let thisControl: FormControl;

  return function forbiddenValuesValidate(control: FormControl) {

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

    if (arrayOfValues.includes(thisControl.value)) {
      return {forbidden : true};
    }

    return null;
  }
}
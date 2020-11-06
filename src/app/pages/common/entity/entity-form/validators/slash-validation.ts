import { AbstractControl } from '@angular/forms';
import { FormControl, FormGroup } from '@angular/forms'

export function slashValidation() {

  let thisControl: FormControl;
  let regexString: RegExp = new RegExp('[^/]+');
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

    if (thisControl.value.includes("/")) {
      return {slash:true}
    }
    return null;
  }
}
import { FormControl } from '@angular/forms'

export function forbiddenValues(arrayOfValues: any, caseInsensitive?: boolean) {
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

    if (caseInsensitive) {
      arrayOfValues.forEach((item) => {
        item = item.toLowerCase();
      })
      if (arrayOfValues.includes(thisControl.value.toLowerCase())) {
        return {forbidden : true, value:thisControl.value};
      }
    } else {
      if (arrayOfValues.includes(thisControl.value)) {
        return {forbidden : true, value:thisControl.value};
      }
    }

    return null;
  }
}
